"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { ActivityModal } from "@/components/ui/admin/activity-modal";
import { AdminHeader } from "@/components/ui/admin/admin-header";
import { MiniCalendar } from "@/components/ui/admin/mini-calendar";
import { PendingRequests } from "@/components/ui/admin/pending-requests";
import { StaffPage } from "@/components/ui/admin/placeholder-pages";
import { ProductsInventory } from "@/components/ui/admin/products-inventory";
import { QuickActions } from "@/components/ui/admin/quick-actions";
import { SettingsPage } from "@/components/ui/admin/settings-page";
import { StatsCards } from "@/components/ui/admin/stats-cards";
import { TransactionsTable } from "@/components/ui/admin/transactions-table";
import { StudentPage } from "@/components/ui/admin/user-page";
import { auth, db } from "@/configs/firebase";

interface Transaction {
	id?: string;
	orderId?: string;
	staffName?: string;
	items?: {
		id: string;
		category: string;
		image: string;
		quantity: number;
		name: string;
		price: number;
	}[];
	total?: number;
	amount?: number;
	timestamp: number;
	status: "Completed" | "Pending" | "Cancelled" | "Approved";
	type?: "transaction" | "topup";
	studentName?: string;
	paymentMethod?: string;
}

type FilterType = "All" | "Pending" | "Completed" | "Cancelled" | "Approved";
type PageType = "dashboard" | "products" | "staff" | "users" | "reports" | "settings" | "topups";

export default function AdminPanel() {
	const getToday = () => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	};

	const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<FilterType>("All");
	const [username, setUsername] = useState("");
	const [role, setRole] = useState("");
	const [currentTime, setCurrentTime] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [modalContent, setModalContent] = useState({ title: "", message: "" });
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [topUps, setTopUps] = useState<Transaction[]>([]);
	const [logDate, setLogDate] = useState<Date>(getToday());
	const [totalTopUps, setTotalTopUps] = useState(0);
	const [isAuthReady, setIsAuthReady] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (!user) {
				window.location.href = "/";
				return;
			}

			const userSnap = await getDoc(doc(db, "users", user.uid));
			const firestoreRole = userSnap.exists() ? userSnap.data().role?.toLowerCase() : null;

			if (firestoreRole !== "admin") {
				window.location.href = "/";
				return;
			}

			localStorage.setItem("role", firestoreRole);
			setUsername(user.displayName || user.email || "Admin");
			setRole(firestoreRole);
			setIsAuthReady(true);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			const ampm = hours >= 12 ? "PM" : "AM";
			const displayHours = hours % 12 || 12;
			const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
			setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`);
		};

		updateTime();
		const interval = setInterval(updateTime, 60000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!isAuthReady) return;

		const startOfDay = new Date(logDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(logDate);
		endOfDay.setHours(23, 59, 59, 999);

		const transactionsQuery = query(
			collection(db, "transactions"),
			where("timestamp", ">=", startOfDay.getTime()),
			where("timestamp", "<=", endOfDay.getTime()),
		);

		const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
			const data: Transaction[] = snapshot.docs.map((snapshotDoc) => ({
				id: snapshotDoc.id,
				type: "transaction",
				...(snapshotDoc.data() as Omit<Transaction, "id" | "type">),
			}));
			setTransactions(data);
		});

		return () => unsubscribe();
	}, [logDate, isAuthReady]);

	useEffect(() => {
		if (!isAuthReady) return;

		const startOfDay = new Date(logDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(logDate);
		endOfDay.setHours(23, 59, 59, 999);

		const topUpStatsQuery = query(
			collection(db, "topup_requests"),
			where("status", "==", "approved"),
			where("timestamp", ">=", startOfDay.getTime()),
			where("timestamp", "<=", endOfDay.getTime()),
		);

		const unsubscribe = onSnapshot(topUpStatsQuery, (snapshot) => {
			const total = snapshot.docs.reduce(
				(sum, snapshotDoc) => sum + (snapshotDoc.data().amount || 0),
				0,
			);
			setTotalTopUps(total);
		});

		const now = new Date();
		const msUntilMidnight =
			new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
			now.getTime();
		const midnightTimer = setTimeout(() => setLogDate(getToday()), msUntilMidnight);

		return () => {
			unsubscribe();
			clearTimeout(midnightTimer);
		};
	}, [logDate, isAuthReady]);

	useEffect(() => {
		if (!isAuthReady) return;

		const startOfDay = new Date(logDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(logDate);
		endOfDay.setHours(23, 59, 59, 999);

		const topUpsQuery = query(
			collection(db, "topup_requests"),
			where("timestamp", ">=", startOfDay.getTime()),
			where("timestamp", "<=", endOfDay.getTime()),
		);

		const unsubscribe = onSnapshot(topUpsQuery, (snapshot) => {
			const data: Transaction[] = snapshot.docs.map((snapshotDoc) => ({
				id: snapshotDoc.id,
				type: "topup",
				status:
					snapshotDoc.data().status === "approved"
						? "Approved"
						: snapshotDoc.data().status === "rejected"
							? "Cancelled"
							: "Pending",
				studentName: snapshotDoc.data().studentName,
				paymentMethod: snapshotDoc.data().paymentMethod,
				amount: snapshotDoc.data().amount,
				timestamp: snapshotDoc.data().timestamp,
			}));
			setTopUps(data);
		});

		return () => unsubscribe();
	}, [logDate, isAuthReady]);

	const handleLogout = async () => {
		await auth.signOut();
		localStorage.removeItem("username");
		localStorage.removeItem("role");
		window.location.href = "/";
	};

	const closeModal = () => setShowModal(false);

	const totalSales = transactions.reduce(
		(sum, transaction) => sum + (isNaN(transaction.total ?? 0) ? 0 : (transaction.total ?? 0)),
		0,
	);

	const mergedTransactions = [
		...transactions.map((transaction) => ({ ...transaction, type: "transaction" as const })),
		...topUps,
	]
		.filter((transaction) => {
			const matchesSearch =
				transaction.type === "topup"
					? transaction.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
					: transaction.staffName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
						transaction.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
			const status = transaction.status || "Completed";
			const matchesFilter = activeFilter === "All" || status === activeFilter;
			return matchesSearch && matchesFilter;
		})
		.sort((a, b) => b.timestamp - a.timestamp);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(127,29,29,0.08),_transparent_32%),linear-gradient(to_bottom,_#fff7f7,_#f8fafc_28%,_#f9fafb)]">
			<AdminHeader
				displayName={username}
				role={role}
				currentTime={currentTime}
				onLogout={handleLogout}
			/>

			<div className="relative z-0 flex flex-1 overflow-hidden">
				<main className="min-w-0 flex-1 overflow-y-auto p-6">
					{currentPage === "dashboard" && (
						<>
							<StatsCards
								totalSales={`PHP ${totalSales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
								totalOrders={transactions.length}
								totalTopUps={`PHP ${totalTopUps.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
							/>
							<TransactionsTable
								transactions={mergedTransactions}
								searchQuery={searchQuery}
								onSearchChange={setSearchQuery}
								activeFilter={activeFilter}
								onFilterChange={(filter) => setActiveFilter(filter)}
							/>
						</>
					)}
					{currentPage === "products" && <ProductsInventory />}
					{currentPage === "staff" && <StaffPage />}
					{currentPage === "users" && <StudentPage />}
					{currentPage === "topups" && <PendingRequests />}
					{currentPage === "settings" && isAuthReady && <SettingsPage />}
				</main>

				<aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white/75 p-6 backdrop-blur-sm">
					<div className="flex flex-col gap-8">
						<div className="settings-enter settings-delay-3">
							<div className="mb-3">
								<h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
									Log History
								</h3>
								<p className="text-xs text-gray-500 mt-1">
									Select a date to view past logs
								</p>
							</div>
							<MiniCalendar
								selectedDate={logDate}
								onDateChange={(date) => {
									setLogDate(date);
									setCurrentPage("dashboard");
								}}
							/>
						</div>

						<hr className="border-gray-200" />

						<div>
							<h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
								Quick Actions
							</h3>
							<QuickActions
								currentPage={currentPage}
								onNavigate={(page) => {
									setCurrentPage(page);
									if (page !== "dashboard") {
										setLogDate(new Date());
									}
								}}
							/>
						</div>
					</div>
				</aside>
			</div>

			<ActivityModal
				isOpen={showModal}
				title={modalContent.title}
				message={modalContent.message}
				onClose={closeModal}
			/>
		</div>
	);
}
