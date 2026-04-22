"use client"

import React, { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/ui/admin/admin-header'
import { StatsCards } from '@/components/ui/admin/stats-cards'
import { TransactionsTable } from '@/components/ui/admin/transactions-table'
import { ProductsInventory } from '@/components/ui/admin/products-inventory'
import { QuickActions } from '@/components/ui/admin/quick-actions'
import { StudentPage } from '@/components/ui/admin/user-page'
import { ActivityModal } from '@/components/ui/admin/activity-modal'
import { onAuthStateChanged } from 'firebase/auth'
import { StaffPage } from '@/components/ui/admin/placeholder-pages'
import { MiniCalendar } from '@/components/ui/admin/mini-calendar'
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db, auth } from '@/configs/firebase'
import { PendingRequests } from '@/components/ui/admin/pending-requests'
import { SettingsPage } from '@/components/ui/admin/settings-page'

interface Transaction {
    id?: string
    orderId?: string
    staffName?: string
    items?: { id: string; category: string; image: string; quantity: number; name: string; price: number }[]
    total?: number
    amount?: number
    timestamp: number
    status: 'Completed' | 'Pending' | 'Cancelled' | 'Approved'
    type?: 'transaction' | 'topup'
    studentName?: string
    paymentMethod?: string
}

interface Product {
    id: string
    name: string
    category: string
    price: string
    stock: number
    status: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

type FilterType = 'All' | 'Pending' | 'Completed' | 'Cancelled'
type PageType = 'dashboard' | 'products' | 'staff' | 'users' | 'reports' | 'settings' | 'topups'

export default function AdminPanel() {
    const getToday = () => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

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
    const [topUps, setTopUps] = useState<Transaction[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(true)
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [logDate, setLogDate] = useState<Date>(getToday())
    const [totalTopUps, setTotalTopUps] = useState(0)

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

    // Realtime listener — Transactions
    useEffect(() => {
        setLoadingTransactions(true)
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
                type: 'transaction' as const,
                ...(doc.data() as Omit<Transaction, 'id' | 'type'>),
            }))
            setTransactions(data)
            setLoadingTransactions(false)
        })
        return () => unsubscribe()
    }, [logDate])

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

    // Realtime listener — Top Ups (for total amount stat)
    useEffect(() => {
        const startOfDay = new Date(logDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(logDate)
        endOfDay.setHours(23, 59, 59, 999)

        const q = query(
            collection(db, 'topup_requests'),
            where('status', '==', 'approved'),
            where('timestamp', '>=', startOfDay.getTime()),
            where('timestamp', '<=', endOfDay.getTime())
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
            setTotalTopUps(total)
        })

        const now = new Date()
        const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
        const midnightTimer = setTimeout(() => window.location.reload(), msUntilMidnight)

        return () => {
            unsubscribe()
            clearTimeout(midnightTimer)
        }
    }, [logDate])

    // Realtime listener — Top Ups (for table display)
    useEffect(() => {
        const startOfDay = new Date(logDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(logDate)
        endOfDay.setHours(23, 59, 59, 999)

        const q = query(
            collection(db, 'topup_requests'),
            where('timestamp', '>=', startOfDay.getTime()),
            where('timestamp', '<=', endOfDay.getTime())
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Transaction[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                type: 'topup' as const,
                status: doc.data().status === 'approved' ? 'Approved' :
                    doc.data().status === 'rejected' ? 'Cancelled' : 'Pending',
                studentName: doc.data().studentName,
                paymentMethod: doc.data().paymentMethod,
                amount: doc.data().amount,
                timestamp: doc.data().timestamp,
            }))
            setTopUps(data)
        })
        return () => unsubscribe()
    }, [logDate])

    const handleLogout = async () => {
        await auth.signOut()
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        localStorage.removeItem('adminEmail')
        localStorage.removeItem('adminPassword')
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

    const totalSales = transactions
        .reduce((sum, t) => sum + (isNaN(t.total ?? 0) ? 0 : t.total ?? 0), 0)

    // Merge transactions + topups, apply search and filter
    const mergedTransactions = [
        ...transactions.map(t => ({ ...t, type: 'transaction' as const })),
        ...topUps
    ]
        .filter((t) => {
            const matchesSearch = t.type === 'topup'
                ? t.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
                : t.staffName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.orderId?.toLowerCase().includes(searchQuery.toLowerCase())
            const status = t.status || 'Completed'
            const matchesFilter = activeFilter === 'All' || status === activeFilter
            return matchesSearch && matchesFilter
        })
        .sort((a, b) => b.timestamp - a.timestamp)

    if (loadingProducts) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-lg">Loading...</p>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <AdminHeader
                displayName={username}
                role={role}
                currentTime={currentTime}
                onLogout={handleLogout}
            />

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 p-6 overflow-y-auto">
                    {currentPage === 'dashboard' && (
                        <>
                            <StatsCards
                                totalSales={`₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                                totalOrders={transactions.length}
                                totalTopUps={`₱${totalTopUps.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
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
                    {currentPage === 'products' && <ProductsInventory />}
                    {currentPage === 'staff' && <StaffPage />}
                    {currentPage === 'users' && <StudentPage />}
                    {currentPage === 'topups' && <PendingRequests />}
                    {currentPage === 'settings' && <SettingsPage />}  {/* ✅ add this */}
                    
                </main>

                <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex flex-col gap-8">
                    <div>
                        <div className="mb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Log History</h3>
                            <p className="text-xs text-gray-500 mt-1">Select a date to view past logs</p>
                        </div>
                        <MiniCalendar
                            selectedDate={logDate}
                            onDateChange={(date) => {
                                setLogDate(date)
                                setCurrentPage('dashboard')
                            }}
                        />
                    </div>

                    <hr className="border-gray-200" />

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Quick Actions</h3>
                        <QuickActions
                            currentPage={currentPage}
                            onNavigate={(page) => {
                                setCurrentPage(page)
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