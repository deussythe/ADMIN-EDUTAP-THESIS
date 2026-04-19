"use client"

import React, { useState, useRef } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/configs/firebase'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'

export function CreateUserPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const rfidInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: '',
        gradeLevel: '',
        studentNumber: '',
        schoolEmail: '',
        guardianName: '',
        guardianEmail: '',
        guardianPassword: '',
        contactNumber: '',
        rfidSerial: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRfidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            rfidInputRef.current?.blur()
        }
    }

    const clearForm = () => setFormData({
        name: '', gradeLevel: '', studentNumber: '', schoolEmail: '',
        guardianName: '', guardianEmail: '', guardianPassword: '',
        contactNumber: '', rfidSerial: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const defaultPassword = formData.guardianPassword
            const savedAdminEmail = localStorage.getItem("adminEmail") || ""
            const savedAdminPassword = localStorage.getItem("adminPassword") || ""

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.guardianEmail.toLowerCase(),
                defaultPassword
            )
            const guardianUid = userCredential.user.uid

            await addDoc(collection(db, 'students'), {
                name: formData.name,
                gradeLevel: formData.gradeLevel,
                studentNumber: formData.studentNumber,
                schoolEmail: formData.schoolEmail,
                rfidSerial: formData.rfidSerial,
                balance: 0,
                guardianId: guardianUid,
                guardianName: formData.guardianName,
                guardianEmail: formData.guardianEmail.toLowerCase(),
                contactNumber: formData.contactNumber,
                status: 'Active',
                createdAt: Date.now()
            })

            await setDoc(doc(db, 'users', guardianUid), {
                name: formData.guardianName,
                email: formData.guardianEmail.toLowerCase(),
                role: 'parent',
                studentName: formData.name,
                status: 'Active',
                createdAt: Date.now()
            })

            await signInWithEmailAndPassword(auth, savedAdminEmail, savedAdminPassword)

            setMessage({ type: 'success', text: `Account created! Guardian can log in with: ${formData.guardianEmail} / ${defaultPassword}` })
            clearForm()
        } catch (error: any) {
            console.error("Error:", error)
            setMessage({ type: 'error', text: error.message || 'Failed to create user.' })
        } finally {
            setLoading(false)
        }
    }

    const handleConnectReader = async () => {
        try {
            const devices = await (navigator as any).hid.requestDevice({ filters: [] })
            if (devices.length > 0) {
                const device = devices[0]
                await device.open()
                console.log("Connected to RFID Reader:", device.productName)
                device.oninputreport = (event: any) => {
                    const { data } = event
                    const array = new Uint8Array(data.buffer)
                    const serial = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
                    setFormData(prev => ({ ...prev, rfidSerial: serial }))
                }
            }
        } catch (err) {
            console.error("HID Connection Error:", err)
        }
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Student Profile</h2>

            {message.text && (
                <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* SECTION 1: Student Details */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Student Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="Juan Dela Cruz" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                            <input type="text" name="studentNumber" value={formData.studentNumber} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="2024-XXXX" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                            <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none bg-white">
                                <option value="" disabled>Select Grade Level</option>
                                <option value="Grade 1">Grade 1</option>
                                <option value="Grade 2">Grade 2</option>
                                <option value="Grade 3">Grade 3</option>
                                <option value="Grade 4">Grade 4</option>
                                <option value="Grade 5">Grade 5</option>
                                <option value="Grade 6">Grade 6</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Email</label>
                            <input type="email" name="schoolEmail" value={formData.schoolEmail} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="student@school.edu.ph" />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Guardian Information */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                            <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="Maria Dela Cruz" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="09XX XXX XXXX" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email Address</label>
                            <input type="email" name="guardianEmail" value={formData.guardianEmail} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="guardian@example.com" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Password</label>
                            <input type="password" name="guardianPassword" value={formData.guardianPassword} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="Create a password" />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: RFID Assignment */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">RFID Card Assignment</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Ready to Scan</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Click inside the field below, then tap the RFID card on the reader to automatically input the serial number.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Serial Number</label>
                        <input ref={rfidInputRef} type="text" name="rfidSerial" value={formData.rfidSerial}
                            onChange={handleChange} onKeyDown={handleRfidKeyDown} required
                            className="w-full p-3 border-2 border-dashed border-gray-400 rounded-md focus:ring-black focus:border-black outline-none text-center font-mono text-lg bg-white"
                            placeholder="Tap card to scan..." />
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex gap-4 justify-end pt-4 border-t">
                    <button
                        type="button"
                        onClick={clearForm}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        Clear Form
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-8 py-2 text-white font-medium rounded-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} transition-colors`}>
                        {loading ? 'Saving...' : 'Create Student'}
                    </button>
                    <button
                        type="button"
                        onClick={handleConnectReader}
                        className="px-6 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors">
                        🔌 Connect Reader
                    </button>
                </div>

            </form>
        </div>
    )
}