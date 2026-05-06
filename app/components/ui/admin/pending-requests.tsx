"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import {
	collection,
	doc,
	onSnapshot,
	query,
	runTransaction,
	updateDoc,
	where,
} from "firebase/firestore";
import { writeAccountAuditLog } from "@/configs/auditLogService";
import { auth, db } from "@/configs/firebase";
import { SystemDialog } from "@/components/ui/admin/system-dialog";

interface TopUpRequest {
	id: string;
	studentId: string;
	studentName: string;
	amount: number;
	referenceNo: string;
	paymentMethod: string;
	status: string;
	timestamp: number;
}

interface DialogState {
	isOpen: boolean;
	title: string;
	message: string;
	variant: "info" | "success" | "danger";
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm?: () => void;
}

export function PendingRequests() {
	const [requests, setRequests] = useState<TopUpRequest[]>([]);
	const [loading, setLoading] = useState(false);
	const [transactionsEnabled, setTransactionsEnabled] = useState(true);
	const [dialog, setDialog] = useState<DialogState>({
		isOpen: false,
		title: "",
		message: "",
		variant: "info",
		confirmLabel: "OK",
	});

	useEffect(() => {
		const requestsQuery = query(
			collection(db, "topup_requests"),
			where("status", "==", "pending"),
		);
		const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
			const pendingData = snapshot.docs.map((snapshotDoc) => ({
				id: snapshotDoc.id,
				...snapshotDoc.data(),
			})) as TopUpRequest[];
			setRequests(pendingData.sort((a, b) => b.timestamp - a.timestamp));
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const settingsRef = doc(db, "settings", "transaction_control");
		const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
			setTransactionsEnabled(snapshot.exists() ? snapshot.data().enabled !== false : true);
		});

		return () => unsubscribe();
	}, []);

	const closeDialog = () =>
		setDialog((current) => ({
			...current,
			isOpen: false,
			onConfirm: undefined,
		}));

	const showNotice = (
		title: string,
		message: string,
		variant: "info" | "success" | "danger" = "info",
	) => {
		setDialog({
			isOpen: true,
			title,
			message,
			variant,
			confirmLabel: "Got it",
		});
	};

	const showConfirm = (
		title: string,
		message: string,
		onConfirm: () => void,
		confirmLabel = "Continue",
	) => {
		setDialog({
			isOpen: true,
			title,
			message,
			variant: "danger",
			confirmLabel,
			cancelLabel: "Cancel",
			onConfirm: () => {
				closeDialog();
				onConfirm();
			},
		});
	};

	const handleApprove = async (request: TopUpRequest) => {
		if (!transactionsEnabled) {
			showNotice("Transactions Paused", "Transactions are currently disabled in Settings.");
			return;
		}

		showConfirm(
			"Approve Top-Up",
			`Approve PHP ${request.amount.toFixed(2)} top-up for ${request.studentName}?`,
			() => {
				void processApprove(request);
			},
			"Approve",
		);
	};

	const processApprove = async (request: TopUpRequest) => {
		setLoading(true);

		try {
			const actor = auth.currentUser;
			const processedAt = Date.now();
			const settingsRef = doc(db, "settings", "transaction_control");
			const requestRef = doc(db, "topup_requests", request.id);
			const studentRef = doc(db, "students", request.studentId);
			let previousBalance = 0;
			let newBalance = 0;

			await runTransaction(db, async (transaction) => {
				const settingsSnap = await transaction.get(settingsRef);
				const requestSnap = await transaction.get(requestRef);
				const studentSnap = await transaction.get(studentRef);

				const settingsAreEnabled = settingsSnap.exists()
					? settingsSnap.data().enabled !== false
					: true;
				if (!settingsAreEnabled) {
					throw new Error("Transactions are currently disabled in Settings.");
				}

				if (!requestSnap.exists()) {
					throw new Error("Top-up request no longer exists.");
				}

				if (!studentSnap.exists()) {
					throw new Error("Student record not found.");
				}

				if (requestSnap.data().status !== "pending") {
					throw new Error("This top-up request has already been processed.");
				}

				previousBalance = Number(studentSnap.data().balance ?? 0);
				newBalance = previousBalance + request.amount;
				transaction.update(studentRef, { balance: newBalance });
				transaction.update(requestRef, {
					status: "approved",
					processedAt,
					processedById: actor?.uid ?? null,
					processedByLabel: actor?.displayName || actor?.email || "Unknown user",
				});
			});

			await writeAccountAuditLog({
				action: "approved",
				targetType: "topup",
				targetId: request.id,
				targetName: `Top-up for ${request.studentName}`,
				details: {
					source: "admin panel",
					studentId: request.studentId,
					studentName: request.studentName,
					amount: request.amount,
					paymentMethod: request.paymentMethod,
					referenceNo: request.referenceNo,
					previousBalance,
					newBalance,
				},
				notificationTitle: "Top-up approved",
				notificationMessage: `Approved PHP ${request.amount.toFixed(2)} for ${request.studentName}.`,
			});

			showNotice(
				"Top-Up Approved",
				`Successfully added PHP ${request.amount.toFixed(2)} to ${request.studentName}'s wallet.`,
				"success",
			);
		} catch (error: any) {
			showNotice(
				"Approval Failed",
				error?.message || "Failed to approve transaction.",
				"danger",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleReject = async (request: TopUpRequest) => {
		if (!transactionsEnabled) {
			showNotice("Transactions Paused", "Transactions are currently disabled in Settings.");
			return;
		}

		showConfirm(
			"Reject Top-Up",
			"Are you sure you want to reject this top-up?",
			() => {
				void processReject(request);
			},
			"Reject",
		);
	};

	const processReject = async (request: TopUpRequest) => {
		setLoading(true);

		try {
			const actor = auth.currentUser;
			await updateDoc(doc(db, "topup_requests", request.id), {
				status: "rejected",
				processedAt: Date.now(),
				processedById: actor?.uid ?? null,
				processedByLabel: actor?.displayName || actor?.email || "Unknown user",
			});

			await writeAccountAuditLog({
				action: "rejected",
				targetType: "topup",
				targetId: request.id,
				targetName: `Top-up for ${request.studentName}`,
				details: {
					source: "admin panel",
					studentId: request.studentId,
					studentName: request.studentName,
					amount: request.amount,
					paymentMethod: request.paymentMethod,
					referenceNo: request.referenceNo,
					status: "rejected",
				},
				notificationTitle: "Top-up rejected",
				notificationMessage: `Rejected PHP ${request.amount.toFixed(2)} for ${request.studentName}.`,
			});

			showNotice(
				"Top-Up Rejected",
				`Rejected PHP ${request.amount.toFixed(2)} top-up for ${request.studentName}.`,
				"success",
			);
		} catch (error: any) {
			showNotice(
				"Rejection Failed",
				error?.message || "Failed to reject the top-up request.",
				"danger",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="settings-enter settings-delay-2 admin-surface p-6">
				<h2 className="mb-2 text-xl font-semibold text-gray-900">
					Pending Top-Up Approvals
				</h2>
				<p className="mb-5 text-sm text-gray-500">
					Review wallet funding requests and act without leaving the queue.
				</p>
				{!transactionsEnabled && (
					<div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						Transaction approvals are disabled from Settings. Enable transactions to
						approve or reject requests.
					</div>
				)}
				{requests.length === 0 ? (
					<div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-400">
						No pending requests at the moment.
					</div>
				) : (
					<div className="space-y-4">
						{requests.map((req) => (
							<div
								key={req.id}
								className="admin-interactive flex flex-col items-center justify-between rounded-3xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row">
								<div className="mb-4 sm:mb-0">
									<p className="font-semibold text-gray-900">{req.studentName}</p>
									<p className="text-sm text-gray-600">
										<span className="font-medium text-blue-600">
											PHP {req.amount.toFixed(2)}
										</span>{" "}
										via {req.paymentMethod}
									</p>
									<div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-sm">
										<span className="border-r border-blue-200 pr-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
											Ref
										</span>
										<span className="font-mono text-base font-bold tracking-[0.08em] text-gray-800 sm:text-lg">
											{req.referenceNo}
										</span>
									</div>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => handleReject(req)}
										disabled={loading || !transactionsEnabled}
										className="flex items-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-50 disabled:opacity-50 disabled:hover:translate-y-0">
										<X className="mr-1 h-4 w-4" /> Reject
									</button>
									<button
										onClick={() => handleApprove(req)}
										disabled={loading || !transactionsEnabled}
										className="flex items-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
										<Check className="mr-1 h-4 w-4" /> Verify & Approve
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			<SystemDialog
				isOpen={dialog.isOpen}
				title={dialog.title}
				message={dialog.message}
				variant={dialog.variant}
				confirmLabel={dialog.confirmLabel}
				cancelLabel={dialog.cancelLabel}
				onClose={closeDialog}
				onConfirm={dialog.onConfirm}
			/>
		</>
	);
}
