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
import { PendingRequests } from '@/components/ui/admin/pending-requests'

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
type PageType = 'dashboard' | 'products' | 'staff' | 'users' | 'reports' | 'settings' | 'topups'

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

    const connectReader = async () => {
        try {
            const devices = await (navigator as any).hid.requestDevice({ filters: [] })
            if (devices.length > 0) {
                const device = devices[0]
                await device.open()
                console.log("Connected to:", device.productName)
                device.oninputreport = (event: any) => {
                    const { data } = event
                    console.log("Raw RFID Data:", new Uint8Array(data.buffer))
                }
            }
        } catch (error) {
            console.error("Connection failed:", error)
        }
    }

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
                ...(doc.data() as Omit<Transaction, 'id'>),
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

    const handleLogout = async () => {
    await auth.signOut()
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('adminEmail')      // add this
    localStorage.removeItem('adminPassword')   // add this
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

            {/* Flex container for sidebar + main */}
            <div className="flex flex-1 overflow-hidden">

                {/* Main content area */}
                <main className="flex-1 p-6 overflow-y-auto">
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
                    {currentPage === 'users' && <CreateUserPage />}
                    {currentPage === 'topups' && <PendingRequests />}
                </main>

                {/* Sidebar */}
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