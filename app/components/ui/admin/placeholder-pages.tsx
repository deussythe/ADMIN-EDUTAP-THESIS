import { Users, Phone, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,    // Add this
    setDoc,
    doc,
    query,
    where,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/configs/firebase'

interface StaffMember {
    id: string
    displayName: string
    role: string
    email: string
    phone: string
    status: 'Active' | 'On Leave'
    joined: string
}

export function StaffPage() {
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        displayName: '',
        role: 'Cashier',
        email: '',
        phone: '',
        password: '',
        status: 'Active' as 'Active' | 'On Leave',
    })

    // Realtime listener — only fetch users with role "staff"
    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('role', 'in', ['staff', 'Staff'])
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: StaffMember[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<StaffMember, 'id'>),
            }))
            setStaffMembers(data)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleAddStaff = async () => {
        if (!formData.displayName || !formData.email || !formData.phone || !formData.password) {
            alert('Please fill in all fields')
            return
        }

        try {
            // 1. Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const uid = userCredential.user.uid; // Get the unique ID from Auth

            // 2. Use setDoc and doc() to save to Firestore using the UID as the Document ID
            // Ensure these are imported

            await setDoc(doc(db, 'users', uid), {
                uid: uid,
                displayName: formData.displayName,
                role: 'staff', // This matches your useEffect query 
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                joined: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            });

            setShowModal(false)
            setFormData({
                displayName: '',
                role: 'Cashier',
                email: '',
                phone: '',
                password: '',
                status: 'Active',
            })
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                alert('This email is already registered.')
            } else {
                alert('Failed to add staff: ' + err.message)
            }
        }
    }

    const handleDeleteStaff = async (id: string) => {
        if (confirm('Are you sure you want to remove this staff member?')) {
            await deleteDoc(doc(db, 'users', id))
            // onSnapshot auto-updates the list
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                Loading staff...
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Staff Management</h2>
                        <p className="text-gray-600">Manage your staff members, roles, and permissions.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        + Add Staff
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">
                                        No staff members found.
                                    </td>
                                </tr>
                            ) : (
                                staffMembers.map((staff) => (
                                    <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{staff.displayName}</p>
                                                    <p className="text-sm text-gray-500">{staff.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="w-4 h-4" />
                                                {staff.phone || '—'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${staff.status === 'Active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {staff.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{staff.joined || '—'}</td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => handleDeleteStaff(staff.id)}
                                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">Add New Staff Member</h2>
                            <p className="text-sm text-gray-500">Fill in the details below</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="Cashier">Cashier</option>
                                    <option value="Store Manager">Store Manager</option>
                                    <option value="Inventory Manager">Inventory Manager</option>
                                    <option value="Sales Associate">Sales Associate</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Set initial password"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+63 XXX XXX XXXX"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'On Leave' })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddStaff}
                                className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                            >
                                Add Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}