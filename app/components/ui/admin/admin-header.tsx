"use client";

import { AlertCircle, Bell, Clock, CreditCard, LogOut, Receipt, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	collection,
	doc,
	limit,
	onSnapshot,
	orderBy,
	query,
	updateDoc,
	where,
} from "firebase/firestore";
import {
	applyFavicon,
	readBrandingCache,
	subscribeToBrandingSettings,
} from "@/configs/branding";
import { db } from "@/configs/firebase";

interface Notification {
	id: string;
	title: string;
	message: string;
	timestamp: number;
	read: boolean;
	type: "student" | "topup" | "transaction" | "general";
}

interface AdminHeaderProps {
	displayName: string;
	role: string;
	currentTime: string;
	onLogout: () => void;
}

export function AdminHeader({ displayName, role, currentTime, onLogout }: AdminHeaderProps) {
	const [showNotif, setShowNotif] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [notificationError, setNotificationError] = useState<string | null>(null);
	const [schoolName, setSchoolName] = useState("St. Clare College of Caloocan");
	const [canteenName, setCanteenName] = useState("EDUTAP");
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const cachedBranding = readBrandingCache();
		if (cachedBranding) {
			setSchoolName(cachedBranding.schoolName);
			setCanteenName(cachedBranding.canteenName);
			setLogoUrl(cachedBranding.logoUrl);
			applyFavicon(cachedBranding.faviconUrl);
		}

		const unsubscribe = subscribeToBrandingSettings((branding) => {
			setSchoolName(branding.schoolName);
			setCanteenName(branding.canteenName);
			setLogoUrl(branding.logoUrl);
			applyFavicon(branding.faviconUrl);
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		const notificationsQuery = query(
			collection(db, "notifications"),
			where("target", "==", "admin"),
			orderBy("timestamp", "desc"),
			limit(20),
		);

		const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
			setNotificationError(null);
			setNotifications(
				snapshot.docs.map(
					(snapshotDoc) =>
						({ id: snapshotDoc.id, ...snapshotDoc.data() }) as Notification,
				),
			);
		}, (error) => {
			console.error("Failed to subscribe to notifications:", error);
			setNotificationError("Notifications could not be loaded right now.");
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowNotif(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const unreadCount = notifications.filter((notification) => !notification.read).length;

	const markAllRead = async () => {
		const unread = notifications.filter((notification) => !notification.read);
		if (unread.length === 0) return;
		try {
			setNotificationError(null);
			await Promise.all(
				unread.map((notification) =>
					updateDoc(doc(db, "notifications", notification.id), { read: true }),
				),
			);
		} catch (error) {
			console.error("Failed to mark all notifications as read:", error);
			setNotificationError("Couldn't mark notifications as read. Please try again.");
		}
	};

	const markOneRead = async (id: string) => {
		try {
			setNotificationError(null);
			await updateDoc(doc(db, "notifications", id), { read: true });
		} catch (error) {
			console.error("Failed to mark notification as read:", error);
			setNotificationError("Couldn't update this notification. Please try again.");
		}
	};

	const formatTime = (timestamp: number) => {
		const diff = Date.now() - timestamp;
		const mins = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	const typeLabel = (type: Notification["type"]) => {
		switch (type) {
			case "student":
				return "Student";
			case "topup":
				return "Top-Up";
			case "transaction":
				return "Transaction";
			default:
				return "Notice";
		}
	};

	const typeIcon = (type: Notification["type"]) => {
		switch (type) {
			case "student":
				return <Users className="h-4 w-4" />;
			case "topup":
				return <CreditCard className="h-4 w-4" />;
			case "transaction":
				return <Receipt className="h-4 w-4" />;
			default:
				return <Bell className="h-4 w-4" />;
		}
	};

	const typeIconClass = (type: Notification["type"]) => {
		switch (type) {
			case "student":
				return "bg-blue-100 text-blue-700";
			case "topup":
				return "bg-emerald-100 text-emerald-700";
			case "transaction":
				return "bg-amber-100 text-amber-700";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	return (
		<header
			className="border-b border-red-900 bg-gradient-to-r from-red-950 via-red-950 to-red-900 px-6 py-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/10">
						{logoUrl ? (
							<img
								src={logoUrl}
								alt="School logo"
								className="h-full w-full object-cover"
							/>
						) : (
							<svg className="h-12 w-12" fill="white" viewBox="0 0 24 24">
								<rect x="3" y="3" width="7" height="7" rx="1" />
								<rect x="14" y="3" width="7" height="7" rx="1" />
								<rect x="3" y="14" width="7" height="7" rx="1" />
								<rect x="14" y="14" width="7" height="7" rx="1" />
							</svg>
						)}
					</div>
					<div>
						<h1 className="text-lg font-semibold text-white">{canteenName}</h1>
						<p className="text-sm text-red-100">{schoolName}</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 text-sm text-white">
						<Users className="w-4 h-4" />
						<span className="font-medium">
							{displayName} ({role === "admin" ? "Administrator" : role})
						</span>
					</div>

					<div className="flex items-center gap-2 text-sm text-red-100">
						<Clock className="h-4 w-4" />
						<span className="font-mono">{currentTime}</span>
					</div>

					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => {
								setShowNotif((value) => !value);
								if (!showNotif) {
									void markAllRead();
								}
							}}
							className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition text-white">
							<Bell className="w-4 h-4" />
							{unreadCount > 0 && (
								<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-red-900">
									{unreadCount > 9 ? "9+" : unreadCount}
								</span>
							)}
						</button>

						{showNotif && (
							<div className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
								<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
									<h3 className="font-semibold text-gray-900 text-sm">
										Notifications
									</h3>
									{notifications.length > 0 && (
										<button
											onClick={() => void markAllRead()}
											className="text-xs text-red-900 hover:underline font-medium">
											Mark all read
										</button>
									)}
								</div>
								{notificationError && (
									<div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
										<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
										<p>{notificationError}</p>
									</div>
								)}

								<div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
									{notifications.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-10 text-gray-400">
											<Bell className="w-8 h-8 mb-2 opacity-30" />
											<p className="text-sm">No notifications yet</p>
										</div>
									) : (
										notifications.map((notification) => (
											<div
												key={notification.id}
												onClick={() => void markOneRead(notification.id)}
												className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
													!notification.read ? "bg-red-50" : ""
												}`}>
												<div
													className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${typeIconClass(notification.type)}`}>
													{typeIcon(notification.type)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-2">
														<div className="min-w-0 flex-1">
															<div className="flex items-center gap-2">
																<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
																	{typeLabel(notification.type)}
																</span>
															</div>
															<p
																className={`mt-1 text-sm leading-tight text-gray-900 ${
																	!notification.read
																		? "font-semibold"
																		: "font-medium"
																}`}>
																{notification.title}
															</p>
														</div>
														{!notification.read && (
															<span className="shrink-0 h-2 w-2 rounded-full bg-red-500 mt-1" />
														)}
													</div>
													<p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
														{notification.message}
													</p>
													<p className="text-[10px] text-gray-400 mt-1">
														{formatTime(notification.timestamp)}
													</p>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						)}
					</div>

					<button
						onClick={onLogout}
						className="flex items-center gap-2 rounded-lg bg-white border border-white px-4 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-50">
						<LogOut className="w-4 h-4" />
						<span>Logout</span>
					</button>
				</div>
			</div>
		</header>
	);
}
