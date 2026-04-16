import { useState } from 'react'

interface TransactionItem {
    id: string
    category: string
    image: string
    quantity: number
    name: string
    price: number
}

interface Transaction {
    id?: string
    orderId: string
    staffName: string
    items: TransactionItem[]
    total: number
    timestamp: number
    status: 'Completed' | 'Pending' | 'Canceled'
}

type FilterType = 'All' | 'Completed' | 'Pending' | 'Canceled'

interface TransactionsTableProps {
    transactions: Transaction[]
    searchQuery: string
    onSearchChange: (query: string) => void
    activeFilter: FilterType
    onFilterChange: (filter: FilterType) => void
}

export function TransactionsTable({
    transactions,
    searchQuery,
    onSearchChange,
    activeFilter,
    onFilterChange
}: TransactionsTableProps) {
    const getStatusColor = (status: 'Completed' | 'Pending' | 'Canceled') => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800'
            case 'Pending': return 'bg-yellow-100 text-yellow-800'
            case 'Canceled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
            </div>

            <div className="p-6">
                {/* Search only — no filter buttons */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by Staff..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {/* ❌ Order ID removed */}
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Staff</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                                {/* ❌ Status removed */}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-sm text-gray-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((transaction) => (
                                    <tr key={transaction.id ?? transaction.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm">{transaction.staffName ?? '—'}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {Array.isArray(transaction.items)
                                                ? transaction.items.map(item => `${item.name} x${item.quantity}`).join(', ')
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium">
                                            ₱{(transaction.total ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
