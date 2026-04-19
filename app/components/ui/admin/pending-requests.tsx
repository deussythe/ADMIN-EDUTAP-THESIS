"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/configs/firebase"
import { Check, X } from "lucide-react"
import { increment } from "firebase/firestore"

interface TopUpRequest {
    id: string
    studentId: string
    studentName: string
    amount: number
    referenceNo: string
    paymentMethod: string
    status: string
    timestamp: number
}

export function PendingRequests() {
    const [requests, setRequests] = useState<TopUpRequest[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const q = query(collection(db, "topup_requests"), where("status", "==", "pending"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pendingData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TopUpRequest[]
            setRequests(pendingData.sort((a, b) => b.timestamp - a.timestamp))
        })
        return () => unsubscribe()
    }, [])

    const handleApprove = async (request: TopUpRequest) => {
        setLoading(true)
        try {
            // 1. Mark Approved
            const requestRef = doc(db, "topup_requests", request.id)
            await updateDoc(requestRef, { status: "approved" })

            // 2. Add to Student Wallet
            const studentRef = doc(db, "students", request.studentId)
            const studentSnap = await getDoc(studentRef)
            
            if (studentSnap.exists()) {
                const currentBalance = studentSnap.data().balance
                await updateDoc(studentRef, { balance: increment(request.amount) })
                alert(`Successfully added ₱${request.amount} to ${request.studentName}'s wallet!`)
            } else {
                alert("Error: Student record not found.")
            }
        } catch (error) {
            alert("Failed to approve transaction.")
        }
        setLoading(false)
    }

    const handleReject = async (requestId: string) => {
        if (!confirm("Are you sure you want to reject this top-up?")) return;
        await updateDoc(doc(db, "topup_requests", requestId), { status: "rejected" })
    }

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Pending GCash Approvals</h2>
            {requests.length === 0 ? (
                <p className="text-gray-500 italic">No pending requests at the moment.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <div className="mb-4 sm:mb-0">
                                <p className="font-semibold text-gray-900">{req.studentName}</p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-blue-600">₱{req.amount.toFixed(2)}</span> via {req.paymentMethod}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 font-mono">Ref: {req.referenceNo}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleReject(req.id)} disabled={loading} className="flex items-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                                    <X className="mr-1 h-4 w-4" /> Reject
                                </button>
                                <button onClick={() => handleApprove(req)} disabled={loading} className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                                    <Check className="mr-1 h-4 w-4" /> Verify & Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}