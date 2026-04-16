"use client"

import React, { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/ui/admin/admin-header'
import { StatsCards } from '@/components/ui/admin/stats-cards'
import { TransactionsTable } from '@/components/ui/admin/transactions-table'
import { ProductsInventory } from '@/components/ui/admin/products-inventory'
import { QuickActions } from '@/components/ui/admin/quick-actions'
import { SystemStatus } from '@/components/ui/admin/system-status'
import { ActivityModal } from '@/components/ui/admin/activity-modal'
import { StaffPage } from '@/components/ui/admin/placeholder-pages'
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    where,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
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
type PageType = 'dashboard' | 'products' | 'staff' | 'reports' | 'settings'

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
    const [loading, setLoading] = useState(true)

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

    // Realtime listener — Transactions (today only, using timestamp)
    useEffect(() => {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date()
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
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Realtime listener — Products
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const data: Product[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Product, 'id'>),
            }))
            setProducts(data)
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

    // ✅ Total sales from completed transactions today
    const totalSales = transactions
        .reduce((sum, t) => sum + (isNaN(t.total) ? 0 : t.total), 0)

    // ✅ Top selling product from items array across all today's transactions
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-lg">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader
                username={username}
                role={role}
                currentTime={currentTime}
                onLogout={handleLogout}
            />
            <div className="flex">
                <main className="flex-1 p-6">
                    {currentPage === 'dashboard' && (
                        <>
                            <StatsCards
                                totalSales={`₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                                totalOrders={transactions.length}
                                topSellingProduct={topSellingProduct}
                            />
                            <TransactionsTable
                                transactions={filteredTransactions}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                activeFilter={activeFilter}
                                onFilterChange={(filter) => setActiveFilter(filter)}
                            />
                        </>
                    )}
                    {currentPage === 'products' && <ProductsInventory />}
                    {currentPage === 'staff' && <StaffPage />}
                </main>
                <aside className="w-80 bg-white border-l border-gray-200 p-6">
                    <QuickActions currentPage={currentPage} onNavigate={setCurrentPage} />
                    <SystemStatus
                        activeStaff={5}
                        openRegisters={2}
                        onViewAllActivity={handleViewAllActivity}
                    />
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