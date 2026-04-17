"use client"

import React, { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/ui/admin/admin-header'
import { StatsCards } from '@/components/ui/admin/stats-cards'
import { TransactionsTable } from '@/components/ui/admin/transactions-table'
import { ProductsInventory } from '@/components/ui/admin/products-inventory'
import { QuickActions } from '@/components/ui/admin/quick-actions'
import { CreateUserPage } from '@/components/ui/admin/user-page'
import { ActivityModal } from '@/components/ui/admin/activity-modal'
import { onAuthStateChanged } from 'firebase/auth'
import { StaffPage } from '@/components/ui/admin/placeholder-pages'
import { MiniCalendar } from '@/components/ui/admin/mini-calendar'
import { collection, query, where, getDocs, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db, auth } from '@/configs/firebase'

interface Transaction {
    id?: string
    orderId: string
    staffName: string
    items: { id: string; category: string; image: string; quantity: number; name: string; price: number }[]
    total: number
    timestamp: number
    status: 'Completed' | 'Pending' | 'Canceled'
}

interface Product {
    id: string
    name: string
    category: string
    price: string
    stock: number
    status: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

type FilterType = 'All' | 'Pending' | 'Completed' | 'Canceled'
type PageType = 'dashboard' | 'products' | 'staff' | 'users' | 'reports' | 'settings'

export default function AdminPanel() {
    const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<FilterType>('All')
    const [username, setUsername] = useState('')
    const [role, setRole] = useState('')
    const [currentTime, setCurrentTime] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalContent, setModalContent] = useState({ title: '', message: '' })
    const [products, setProducts] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(true)
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [logDate, setLogDate] = useState<Date>(new Date())

    // Firebase Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) { window.location.href = '/'; return }
            const storedRole = localStorage.getItem('role')
            if (storedRole !== 'admin') { window.location.href = '/'; return }
            setUsername(user.displayName || user.email || 'Admin')
            setRole(storedRole)
        })
        return () => unsubscribe()
    }, [])

    // Clock
    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            const hours = now.getHours()
            const minutes = now.getMinutes()
            const ampm = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12
            const displayMinutes = minutes < 10 ? `0${minutes}` : minutes
            setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`)
        }
        updateTime()
        const interval = setInterval(updateTime, 60000)
        return () => clearInterval(interval)
    }, [])

    // Realtime listener — Transactions (Now linked to the Calendar!)
    useEffect(() => {
        setLoadingTransactions(true) // Show loading state when changing days

        // 1. Use the 'logDate' state instead of a blank new Date()
        const startOfDay = new Date(logDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(logDate)
        endOfDay.setHours(23, 59, 59, 999)

        const q = query(
            collection(db, 'transactions'),
            where('timestamp', '>=', startOfDay.getTime()),
            where('timestamp', '<=', endOfDay.getTime()),
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Transaction[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Transaction, 'id'>),
            }))
            setTransactions(data)
            setLoadingTransactions(false)
        })
        return () => unsubscribe()
    }, [logDate]) // 2. Add logDate to the dependency array!

    // Realtime listener — Products
    useEffect(() => {
        const q = query(collection(db, 'products'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Product[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Product, 'id'>),
            }))
            setProducts(data)
            setLoadingProducts(false)
        })
        return () => unsubscribe()
    }, [])

    const handleLogout = async () => {
        await auth.signOut()
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        window.location.href = '/'
    }

    const openModal = (title: string, message: string) => {
        setModalContent({ title, message })
        setShowModal(true)
    }

    const closeModal = () => setShowModal(false)

    const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'status'>) => {
        const stockNum = newProductData.stock
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock'
        if (stockNum === 0) status = 'Out of Stock'
        else if (stockNum < 10) status = 'Low Stock'
        else status = 'In Stock'

        await addDoc(collection(db, 'products'), {
            name: newProductData.name,
            category: newProductData.category,
            price: `₱${parseFloat(newProductData.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            stock: stockNum,
            status,
        })
    }

    const handleUpdateProductStock = async (productId: string, newStock: number) => {
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock'
        if (newStock === 0) status = 'Out of Stock'
        else if (newStock < 10) status = 'Low Stock'
        else status = 'In Stock'
        await updateDoc(doc(db, 'products', productId), { stock: newStock, status })
    }

    const handleViewAllActivity = () => {
        openModal('All Activity', 'This would show a comprehensive log of all system activity.')
    }

    const totalSales = transactions
        .reduce((sum, t) => sum + (isNaN(t.total) ? 0 : t.total), 0)

    const productCount: Record<string, number> = {}
    transactions.forEach((t) => {
        t.items?.forEach((item) => {
            productCount[item.name] = (productCount[item.name] ?? 0) + (item.quantity ?? 1)
        })
    })
    const topEntry = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]
    const topSellingProduct = topEntry ? topEntry[0] : 'N/A'

    const filteredTransactions = transactions.filter((t) => {
        const matchesSearch =
            t.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.staffName?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = activeFilter === 'All' || t.status === activeFilter
        return matchesSearch && matchesFilter
    })

    // Change it to ONLY check loadingProducts
    if (loadingProducts) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-lg">Loading...</p>
            </div>
        )
    }

    return (
        // Locked to screen height, no outer scrolling allowed
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <AdminHeader
                displayName={username}
                role={role}
                currentTime={currentTime}
                onLogout={handleLogout}
            />

            {/* Flex container for the middle section */}
            <div className="flex flex-1 overflow-hidden">

                {/* Main area: allowed to scroll internally */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {currentPage === 'dashboard' && (
                        <>
                            <StatsCards
                                totalSales={`₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                                totalOrders={transactions.length}
                                topSellingProduct={topSellingProduct}
                            />
                            {/* Show a localized loading state instead of the table */}
                            {loadingTransactions ? (
                                <div className="mt-6 p-12 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full mb-3"></div>
                                    <p className="text-gray-500 font-medium text-sm">
                                        Loading logs for {logDate.toLocaleDateString()}...
                                    </p>
                                </div>
                            ) : (
                                <TransactionsTable
                                    transactions={filteredTransactions}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    activeFilter={activeFilter}
                                    onFilterChange={(filter) => setActiveFilter(filter)}
                                />
                            )}
                        </>
                    )}
                    {currentPage === 'products' && <ProductsInventory />}
                    {currentPage === 'staff' && <StaffPage />}
                    {currentPage === 'users' && <CreateUserPage />}
                </main>

                {/* Sidebar: allowed to scroll internally if it gets too long */}
                {/* Sidebar: allowed to scroll internally if it gets too long */}
                <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex flex-col gap-8">

                    {/* Top Section: Log History Calendar */}
                    <div>
                        <div className="mb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Log History</h3>
                            <p className="text-xs text-gray-500 mt-1">Select a date to view past logs</p>
                        </div>
                        <MiniCalendar
                            selectedDate={logDate}
                            onDateChange={(date) => {
                                setLogDate(date)
                                // NEW: Force the app back to the dashboard so they can actually see the table!
                                setCurrentPage('dashboard')
                            }}
                        />
                    </div>

                    <hr className="border-gray-200" />

                    {/* Bottom Section: Quick Actions */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Quick Actions</h3>
                        <QuickActions
                            currentPage={currentPage}
                            onNavigate={(page) => {
                                setCurrentPage(page)
                                // NEW: If they navigate away from the dashboard, reset the calendar back to Today
                                if (page !== 'dashboard') {
                                    setLogDate(new Date())
                                }
                            }}
                        />
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
    )
}