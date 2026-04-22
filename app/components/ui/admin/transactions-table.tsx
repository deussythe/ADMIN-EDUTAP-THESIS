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
		<div className="bg-white rounded-lg border border-gray-200">
			<div className="p-6 border-b border-gray-200">
				<h2 className="text-lg font-semibold">Recent Transactions</h2>
			</div>

			<div className="p-6">
				<div className="flex flex-col gap-4 mb-6">
					<div className="flex-1">
						<input
							type="text"
							placeholder="Search by Staff or Student..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
						/>
					</div>
					<div className="flex gap-2">
						{(
							["All", "Completed", "Pending", "Cancelled", "Approved"] as FilterType[]
						).map((filter) => (
							<button
								key={filter}
								onClick={() => onFilterChange(filter)}
								className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
									activeFilter === filter
										? "bg-black text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
										className="py-8 text-center text-sm text-gray-400">
										No transactions found.
									</td>
								</tr>
							) : (
								sorted.map((t) => (
									<tr
										key={t.id}
										className="border-b border-gray-100 hover:bg-gray-50">
										<td className="py-3 px-4 text-sm">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
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
												className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
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
