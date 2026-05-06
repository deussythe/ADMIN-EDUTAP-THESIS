import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { History, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AuditTargetType } from "@/configs/auditLogService";
import { db } from "@/configs/firebase";

interface AuditLogEntry {
	id: string;
	action: string;
	targetType: AuditTargetType;
	targetId: string;
	targetName: string;
	details: unknown;
	actorId?: string | null;
	actorLabel?: string;
	timestamp: number;
	sourceCollection?: "audit_logs" | "topup_requests" | "transactions";
}

interface TopUpRequestActivity {
	id: string;
	studentId?: string;
	studentName?: string;
	amount?: number;
	referenceNo?: string;
	paymentMethod?: string;
	status?: string;
	timestamp?: number;
	source?: string;
	requesterName?: string;
	requestedBy?: string;
	requestedByName?: string;
	guardianName?: string;
	guardianEmail?: string;
	parentEmail?: string;
}

interface TransactionActivity {
	id: string;
	orderId?: string;
	staffName?: string;
	studentName?: string;
	total?: number;
	status?: string;
	timestamp?: number;
	items?: {
		name?: string;
		quantity?: number;
	}[];
}

const actionStyles: Record<string, string> = {
	created: "bg-emerald-100 text-emerald-700",
	updated: "bg-amber-100 text-amber-700",
	deleted: "bg-red-100 text-red-700",
	requested: "bg-blue-100 text-blue-700",
	approved: "bg-emerald-100 text-emerald-700",
	rejected: "bg-rose-100 text-rose-700",
	purchase: "bg-violet-100 text-violet-700",
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatAuditKey(key: string) {
	return key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.replace(/^./, (char) => char.toUpperCase());
}

function formatCurrency(value: unknown) {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return formatAuditValue(value);
	}

	return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function formatAuditValue(value: unknown): string {
	if (value === null || value === undefined || value === "") {
		return "N/A";
	}

	if (typeof value === "number") {
		return Number.isFinite(value) ? String(value) : "N/A";
	}

	if (typeof value === "string" || typeof value === "boolean") {
		return String(value);
	}

	if (Array.isArray(value)) {
		const parts = value.map((item) => formatAuditValue(item)).filter((item) => item !== "N/A");
		return parts.length > 0 ? parts.join(", ") : "N/A";
	}

	if (isRecord(value)) {
		const entries = Object.entries(value)
			.filter(([, entryValue]) => entryValue !== undefined)
			.map(([entryKey, entryValue]) => `${formatAuditKey(entryKey)}: ${formatAuditValue(entryValue)}`);
		return entries.length > 0 ? entries.join(", ") : "N/A";
	}

	return String(value);
}

function getAuditDetailLines(details: unknown): string[] {
	if (details === null || details === undefined || details === "") {
		return ["No details recorded."];
	}

	if (typeof details === "string" || typeof details === "number" || typeof details === "boolean") {
		return [String(details)];
	}

	if (Array.isArray(details)) {
		const items = details.map((item) => formatAuditValue(item)).filter((item) => item !== "N/A");
		return items.length > 0 ? items : ["No details recorded."];
	}

	if (isRecord(details)) {
		const preferredKeys = [
			"source",
			"studentName",
			"staffName",
			"amount",
			"total",
			"paymentMethod",
			"referenceNo",
			"orderId",
			"status",
			"previousBalance",
			"newBalance",
			"items",
			"changedFields",
			"before",
			"after",
		];
		const lines = preferredKeys
			.filter((key) => key in details && details[key] !== undefined)
			.map((key) => {
				const rawValue = details[key];
				const formattedValue =
					key === "amount" || key === "total" || key === "previousBalance" || key === "newBalance"
						? formatCurrency(rawValue)
						: formatAuditValue(rawValue);
				return `${formatAuditKey(key)}: ${formattedValue}`;
			});

		const additionalLines = Object.entries(details)
			.filter(([key, value]) => !preferredKeys.includes(key) && value !== undefined)
			.map(([key, value]) => `${formatAuditKey(key)}: ${formatAuditValue(value)}`);

		const output = [...lines, ...additionalLines];
		return output.length > 0 ? output : ["No details recorded."];
	}

	return [String(details)];
}

function getSearchableLogText(log: AuditLogEntry) {
	return [
		log.targetName,
		log.actorLabel,
		log.action,
		log.targetType,
		...getAuditDetailLines(log.details),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
}

function getTargetTypeLabel(targetType: AuditTargetType) {
	switch (targetType) {
		case "topup":
			return "Top-up";
		case "transaction":
			return "Purchase";
		default:
			return targetType;
	}
}

function mapTopUpRequestToActivity(log: TopUpRequestActivity): AuditLogEntry | null {
	if (typeof log.timestamp !== "number") {
		return null;
	}

	const actorLabel =
		log.requesterName ||
		log.requestedByName ||
		log.requestedBy ||
		log.guardianName ||
		log.guardianEmail ||
		log.parentEmail ||
		"Parent / Student";

	return {
		id: `topup-request-${log.id}`,
		action: "requested",
		targetType: "topup",
		targetId: log.id,
		targetName: `Top-up for ${log.studentName || "Unknown student"}`,
		details: {
			source: log.source || "parent panel",
			studentName: log.studentName || "Unknown student",
			amount: typeof log.amount === "number" ? log.amount : undefined,
			paymentMethod: log.paymentMethod || "GCash",
			referenceNo: log.referenceNo || "N/A",
			status: log.status || "pending",
		},
		actorLabel,
		timestamp: log.timestamp,
		sourceCollection: "topup_requests",
	};
}

function mapTransactionToActivity(log: TransactionActivity): AuditLogEntry | null {
	if (typeof log.timestamp !== "number") {
		return null;
	}

	return {
		id: `transaction-${log.id}`,
		action: "purchase",
		targetType: "transaction",
		targetId: log.id,
		targetName: log.orderId ? `Order ${log.orderId}` : `Transaction ${log.id}`,
		details: {
			source: "cashier panel",
			orderId: log.orderId || "N/A",
			staffName: log.staffName || "Cashier",
			studentName: log.studentName || undefined,
			total: typeof log.total === "number" ? log.total : undefined,
			status: log.status || "Completed",
			items: Array.isArray(log.items)
				? log.items
						.map((item) =>
							item?.name
								? `${item.name}${typeof item.quantity === "number" ? ` x${item.quantity}` : ""}`
								: null,
						)
						.filter(Boolean)
				: undefined,
		},
		actorLabel: log.staffName || "Cashier",
		timestamp: log.timestamp,
		sourceCollection: "transactions",
	};
}

export function AccountLogsPage() {
	const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
	const [topUpActivities, setTopUpActivities] = useState<AuditLogEntry[]>([]);
	const [transactionActivities, setTransactionActivities] = useState<AuditLogEntry[]>([]);
	const [readyState, setReadyState] = useState({
		audit: false,
		topups: false,
		transactions: false,
	});
	const [errorState, setErrorState] = useState<{
		audit?: string;
		topups?: string;
		transactions?: string;
	}>({});
	const [search, setSearch] = useState("");

	useEffect(() => {
		const logsQuery = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
		const unsubscribe = onSnapshot(
			logsQuery,
			(snapshot) => {
				setAuditLogs(
					snapshot.docs.map(
						(snapshotDoc) =>
							({
								id: snapshotDoc.id,
								sourceCollection: "audit_logs",
								...snapshotDoc.data(),
							}) as AuditLogEntry,
					),
				);
				setErrorState((current) => ({ ...current, audit: undefined }));
				setReadyState((current) => ({ ...current, audit: true }));
			},
			(snapshotError) => {
				console.error("Failed to load audit logs:", snapshotError);
				setErrorState((current) => ({
					...current,
					audit:
						snapshotError.code === "permission-denied"
							? "Audit logs are blocked by Firestore rules."
							: "Unable to load audit logs right now.",
				}));
				setReadyState((current) => ({ ...current, audit: true }));
			},
		);

		return unsubscribe;
	}, []);

	useEffect(() => {
		const topUpsQuery = query(
			collection(db, "topup_requests"),
			orderBy("timestamp", "desc"),
			limit(100),
		);
		const unsubscribe = onSnapshot(
			topUpsQuery,
			(snapshot) => {
				setTopUpActivities(
					snapshot.docs
						.map((snapshotDoc) =>
							mapTopUpRequestToActivity({
								id: snapshotDoc.id,
								...(snapshotDoc.data() as Omit<TopUpRequestActivity, "id">),
							}),
						)
						.filter((entry): entry is AuditLogEntry => entry !== null),
				);
				setErrorState((current) => ({ ...current, topups: undefined }));
				setReadyState((current) => ({ ...current, topups: true }));
			},
			(snapshotError) => {
				console.error("Failed to load top-up activity:", snapshotError);
				setErrorState((current) => ({
					...current,
					topups:
						snapshotError.code === "permission-denied"
							? "Top-up activity is blocked by Firestore rules."
							: "Unable to load top-up activity right now.",
				}));
				setReadyState((current) => ({ ...current, topups: true }));
			},
		);

		return unsubscribe;
	}, []);

	useEffect(() => {
		const transactionsQuery = query(
			collection(db, "transactions"),
			orderBy("timestamp", "desc"),
			limit(100),
		);
		const unsubscribe = onSnapshot(
			transactionsQuery,
			(snapshot) => {
				setTransactionActivities(
					snapshot.docs
						.map((snapshotDoc) =>
							mapTransactionToActivity({
								id: snapshotDoc.id,
								...(snapshotDoc.data() as Omit<TransactionActivity, "id">),
							}),
						)
						.filter((entry): entry is AuditLogEntry => entry !== null),
				);
				setErrorState((current) => ({ ...current, transactions: undefined }));
				setReadyState((current) => ({ ...current, transactions: true }));
			},
			(snapshotError) => {
				console.error("Failed to load transaction activity:", snapshotError);
				setErrorState((current) => ({
					...current,
					transactions:
						snapshotError.code === "permission-denied"
							? "Transaction activity is blocked by Firestore rules."
							: "Unable to load transaction activity right now.",
				}));
				setReadyState((current) => ({ ...current, transactions: true }));
			},
		);

		return unsubscribe;
	}, []);

	const loading = !readyState.audit || !readyState.topups || !readyState.transactions;
	const errors = Object.values(errorState).filter(Boolean);

	const combinedLogs = useMemo(
		() =>
			[...auditLogs, ...topUpActivities, ...transactionActivities].sort(
				(a, b) => b.timestamp - a.timestamp,
			),
		[auditLogs, topUpActivities, transactionActivities],
	);

	const filteredLogs = useMemo(
		() =>
			combinedLogs.filter((log) => {
				const queryText = search.toLowerCase();
				return getSearchableLogText(log).includes(queryText);
			}),
		[combinedLogs, search],
	);

	return (
		<div className="settings-enter settings-delay-2 admin-surface overflow-hidden">
			<div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-red-100 p-3 text-red-900">
						<History className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
						<p className="mt-1 text-sm text-gray-500">
							View recent account changes, top-up requests, approvals, and cashier
							transactions in one stream.
						</p>
					</div>
				</div>
			</div>

			<div className="p-6">
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search by target, actor, action, source, or details..."
						className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
					/>
				</div>

				<p className="mb-4 text-sm text-gray-500">
					{search
						? `${filteredLogs.length} matching log(s)`
						: `${combinedLogs.length} recent activity log(s)`}
				</p>

				{errors.length > 0 && (
					<div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
						<p className="font-semibold">Some activity sources could not be loaded</p>
						<div className="mt-1 space-y-1">
							{errors.map((error) => (
								<p key={error}>{error}</p>
							))}
						</div>
					</div>
				)}

				{loading ? (
					<div className="flex h-40 items-center justify-center text-sm text-gray-500">
						Loading logs...
					</div>
				) : filteredLogs.length === 0 ? (
					<div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
						No activity logs found.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
										Time
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
										Action
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
										Target
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
										Changed By
									</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
										Details
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredLogs.map((log) => (
									<tr
										key={log.id}
										className="border-b border-gray-100 align-top transition-colors duration-300 hover:bg-red-50/30">
										<td className="px-4 py-4 text-sm text-gray-600">
											{new Date(log.timestamp).toLocaleString("en-PH")}
										</td>
										<td className="px-4 py-4">
											<span
												className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
													actionStyles[log.action] ?? "bg-gray-100 text-gray-700"
												}`}>
												{formatAuditKey(log.action)}
											</span>
										</td>
										<td className="px-4 py-4 text-sm text-gray-800">
											<p className="font-semibold text-gray-900">{log.targetName}</p>
											<p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-400">
												{getTargetTypeLabel(log.targetType)}
											</p>
										</td>
										<td className="px-4 py-4 text-sm text-gray-600">
											{log.actorLabel || "System"}
										</td>
										<td className="px-4 py-4 text-sm leading-6 text-gray-600">
											<div className="space-y-1">
												{getAuditDetailLines(log.details).map((line, index) => (
													<p key={`${log.id}-detail-${index}`}>{line}</p>
												))}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
