"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/configs/firebase"

export function SettingsPage() {
    const [schoolName, setSchoolName] = useState("")
    const [canteenName, setCanteenName] = useState("")
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)

    // ✅ Fetch existing settings from Firebase
    useEffect(() => {
        const fetchSettings = async () => {
            const snap = await getDoc(doc(db, "settings", "canteen_info"))
            if (snap.exists()) {
                const data = snap.data()
                setSchoolName(data.schoolName ?? "")
                setCanteenName(data.canteenName ?? "")
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        await setDoc(doc(db, "settings", "canteen_info"), {
            schoolName,
            canteenName,
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    if (loading) return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            Loading settings...
        </div>
    )

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-xl">
            <h2 className="text-2xl font-semibold mb-2">Settings</h2>
            <p className="text-gray-600 mb-6">Update your school and canteen information. This will appear on printed receipts.</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">School Name</label>
                    <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. St. Clare College of Caloocan"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Canteen Name</label>
                    <input
                        type="text"
                        value={canteenName}
                        onChange={(e) => setCanteenName(e.target.value)}
                        placeholder="e.g. School Canteen"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Settings"}
                </button>
            </div>
        </div>
    )
}