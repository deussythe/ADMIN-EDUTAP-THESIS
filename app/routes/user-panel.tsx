import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/configs/firebase'

export default function UserPanel() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                window.location.href = '/'
                return
            }

            // Fetch their Firestore profile
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (snap.exists()) {
                const data = snap.data()
                // Only allow staff role here
                if (data.role !== 'staff' && data.role !== 'Staff') {
                    window.location.href = '/'
                    return
                }
                setUser({ ...data, email: firebaseUser.email })
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleLogout = async () => {
        await auth.signOut()
        window.location.href = '/'
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Loading...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#8B0000] text-white px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">EDUTAP</h1>
                    <p className="text-sm opacity-80">St. Clare College of Caloocan</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm">{user?.email} ({user?.role})</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-white rounded-lg text-sm hover:bg-white hover:text-[#8B0000] transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="p-8 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <h2 className="text-2xl font-semibold mb-1">Welcome, {user?.displayName}!</h2>
                    <p className="text-gray-500 mb-6">Here's your staff profile.</p>

                    <div className="space-y-4">
                        <div className="flex justify-between border-b pb-3">
                            <span className="text-gray-500">Full Name</span>
                            <span className="font-medium">{user?.displayName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-3">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between border-b pb-3">
                            <span className="text-gray-500">Role</span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{user?.role}</span>
                        </div>
                        {user?.serial && (
                            <div className="flex justify-between border-b pb-3">
                                <span className="text-gray-500">Serial</span>
                                <span className="font-mono text-blue-600">{user?.serial}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b pb-3">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium">{user?.phone || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-3">
                            <span className="text-gray-500">Status</span>
                            <span className={`px-3 py-1 rounded-full text-sm ${user?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {user?.status}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Joined</span>
                            <span className="font-medium">{user?.joined || '—'}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}