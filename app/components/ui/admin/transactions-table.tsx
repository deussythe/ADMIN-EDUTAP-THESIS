import { useState } from "react";

interface TransactionItem {
	id: string;
	category: string;
	image: string;
	quantity: number;
	name: string;
	price: number;
}

interface Transaction {
	id?: string;
	orderId?: string;
	staffName?: string;
	items?: TransactionItem[];
	total?: number;
	amount?: number;
	timestamp: number;
	status: "Completed" | "Pending" | "Cancelled" | "Approved" | "approved";
	type?: "transaction" | "topup";
	studentName?: string;
	paymentMethod?: string;
}

type FilterType = "All" | "Completed" | "Pending" | "Cancelled" | "Approved";

interface TransactionsTableProps {
	transactions: Transaction[];
	searchQuery: string;
	onSearchChange: (query: string) => void;
	activeFilter: FilterType;
	onFilterChange: (filter: FilterType) => void;
}

export function TransactionsTable({
	transactions,
	searchQuery,
	onSearchChange,
	activeFilter,
	onFilterChange,
}: TransactionsTableProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "Completed":
				return "bg-green-100 text-green-800";
			case "Pending":
				return "bg-yellow-100 text-yellow-800";
			case "Cancelled":
				return "bg-red-100 text-red-800";
			case "Approved":
			case "approved":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

	return (
		<div className="settings-enter settings-delay-2 admin-surface overflow-hidden">
			<div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6">
				<h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
				<p className="mt-1 text-sm text-gray-500">
					Monitor purchases and top-up activity in one stream.
				</p>
			</div>

			<div className="p-6">
				<div className="flex flex-col gap-4 mb-6">
					<div className="flex-1">
						<input
							type="text"
							placeholder="Search by Staff or Student..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{(
							["All", "Completed", "Pending", "Cancelled", "Approved"] as FilterType[]
						).map((filter) => (
							<button
								key={filter}
								onClick={() => onFilterChange(filter)}
								className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
									activeFilter === filter
										? "bg-red-950 text-white shadow-sm -translate-y-0.5"
										: "bg-gray-100 text-gray-600 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-900"
								}`}>
								{filter}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
									Type
								</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
									Staff / Student
								</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
									Details
								</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
									Amount
								</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							{sorted.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="py-10 text-center text-sm text-gray-400">
										No transactions found.
									</td>
								</tr>
							) : (
								sorted.map((t) => (
									<tr
										key={t.id}
										className="border-b border-gray-100 transition-colors duration-300 hover:bg-red-50/40">
										<td className="py-3 px-4 text-sm">
											<span
												className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
													t.type === "topup"
														? "bg-purple-100 text-purple-800"
														: "bg-gray-100 text-gray-700"
												}`}>
												{t.type === "topup" ? "💳 Top-Up" : "🛒 Purchase"}
											</span>
										</td>
										<td className="py-3 px-4 text-sm">
											{t.type === "topup"
												? (t.studentName ?? "—")
												: (t.staffName ?? "—")}
										</td>
										<td className="py-3 px-4 text-sm text-gray-600">
											{t.type === "topup"
												? `Via ${t.paymentMethod ?? "GCash"}`
												: Array.isArray(t.items)
													? t.items
															.map((i) => `${i.name} x${i.quantity}`)
															.join(", ")
													: "—"}
										</td>
										<td className="py-3 px-4 text-sm font-medium">
											₱
											{(
												(t.type === "topup" ? t.amount : t.total) ?? 0
											).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
										</td>
										<td className="py-3 px-4 text-sm">
											<span
												className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(t.status)}`}>
												{t.status === "approved" || t.status === "Approved"
													? "Approved"
													: t.status}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
