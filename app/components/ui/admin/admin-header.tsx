"use client"

import { Users, Clock, LogOut, Bell } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, where } from 'firebase/firestore'
import { db } from '@/configs/firebase'

interface Notification {
    id: string
    title: string
    message: string
    timestamp: number
    read: boolean
    type: 'student' | 'topup' | 'transaction' | 'general'
}

interface AdminHeaderProps {
    displayName: string
    role: string
    currentTime: string
    onLogout: () => void
}

export function AdminHeader({ displayName, role, currentTime, onLogout }: AdminHeaderProps) {
    const [showNotif, setShowNotif] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const q = query(
            collection(db, 'notifications'),
            where('target', '==', 'admin'),   // ← only admin notifications
            orderBy('timestamp', 'desc'),
            limit(20)
        )
        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))
        })
        return unsub
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowNotif(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.read)
        await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })))
    }

    const markOneRead = async (id: string) => {
        await updateDoc(doc(db, 'notifications', id), { read: true })
    }

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    const typeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'student': return '👤'
            case 'topup': return '💰'
            case 'transaction': return '🧾'
            default: return '🔔'
        }
    }

    return (
        <header className="bg-gradient-to-r from-red-950 to-red-900 border-b border-red-900 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="bg-white text-red-900 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">EDUTAP</h1>
                        <p className="text-sm text-red-100">St. Clare College of Caloocan</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* User */}
                    <div className="flex items-center gap-2 text-sm text-white">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                            {displayName} ({role === 'admin' ? 'Administrator' : role})
                        </span>
                    </div>

                    {/* Clock */}
                    <div className="flex items-center gap-2 text-sm text-red-100">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">{currentTime}</span>
                    </div>

                    {/* Bell */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => {
                                setShowNotif(v => !v)
                                if (!showNotif) markAllRead()
                            }}
                            className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-red-900">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotif && (
                            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button onClick={markAllRead} className="text-xs text-red-900 hover:underline font-medium">
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                            <Bell className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-sm">No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} onClick={() => markOneRead(n.id)}
                                                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? 'bg-red-50' : ''}`}>
                                                <span className="text-xl shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm text-gray-900 leading-tight ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                                                            {n.title}
                                                        </p>
                                                        {!n.read && <span className="shrink-0 h-2 w-2 rounded-full bg-red-500 mt-1" />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <button onClick={onLogout}
                        className="flex items-center gap-2 rounded-lg bg-white border border-white px-4 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-50">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    )
}