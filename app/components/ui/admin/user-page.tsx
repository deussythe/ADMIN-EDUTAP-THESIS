"use client"

import React, { useState, useRef } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/configs/firebase'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { Upload, X, Camera } from 'lucide-react'

const CLOUDINARY_CLOUD_NAME = "dvjilvllm"
const CLOUDINARY_UPLOAD_PRESET = "edutap_student_photos"

export function CreateUserPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const rfidInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [photoUploading, setPhotoUploading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        gradeLevel: '',
        studentNumber: '',
        schoolEmail: '',
        guardianName: '',
        guardianEmail: '',
        guardianPassword: '',
        confirmPassword: '',
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

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select a valid image file.' })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be less than 5MB.' })
            return
        }
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
        setMessage({ type: '', text: '' })
    }

    const handleRemovePhoto = () => {
        setPhotoFile(null)
        setPhotoPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const uploadPhotoToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        )
        if (!res.ok) throw new Error('Failed to upload photo to Cloudinary.')
        const data = await res.json()
        return data.secure_url
    }

    const clearForm = () => {
        setFormData({
            name: '', gradeLevel: '', studentNumber: '', schoolEmail: '',
            guardianName: '', guardianEmail: '', guardianPassword: '', confirmPassword: '',
            contactNumber: '', rfidSerial: ''
        })
        handleRemovePhoto()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.guardianPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' })
            return
        }
        if (formData.guardianPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
            return
        }

        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            // 1. Upload photo first if selected
            let photoUrl = ''
            if (photoFile) {
                setPhotoUploading(true)
                photoUrl = await uploadPhotoToCloudinary(photoFile)
                setPhotoUploading(false)
            }

            const savedAdminEmail = localStorage.getItem("adminEmail") || ""
            const savedAdminPassword = localStorage.getItem("adminPassword") || ""

            // 2. Create guardian Firebase Auth account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.guardianEmail.toLowerCase(),
                formData.guardianPassword
            )
            const guardianUid = userCredential.user.uid

            // 3. Save student to Firestore (with photoUrl)
            await addDoc(collection(db, 'students'), {
                name: formData.name,
                gradeLevel: formData.gradeLevel,
                studentNumber: formData.studentNumber,
                schoolEmail: formData.schoolEmail,
                rfidSerial: formData.rfidSerial,
                photoUrl,
                balance: 0,
                guardianId: guardianUid,
                guardianName: formData.guardianName,
                guardianEmail: formData.guardianEmail.toLowerCase(),
                contactNumber: formData.contactNumber,
                status: 'Active',
                createdAt: Date.now()
            })

            // 4. Save guardian user doc
            await setDoc(doc(db, 'users', guardianUid), {
                name: formData.guardianName,
                email: formData.guardianEmail.toLowerCase(),
                role: 'parent',
                studentName: formData.name,
                status: 'Active',
                createdAt: Date.now()
            })

            // 5. Re-sign in as admin
            await signInWithEmailAndPassword(auth, savedAdminEmail, savedAdminPassword)

            setMessage({ type: 'success', text: `Account created! Guardian can log in with: ${formData.guardianEmail} / ${formData.guardianPassword}` })
            clearForm()
        } catch (error: any) {
            console.error("Error:", error)
            setPhotoUploading(false)
            setMessage({ type: 'error', text: error.message || 'Failed to create user.' })
        } finally {
            setLoading(false)
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

                {/* SECTION 0: Student Photo */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Student Photo</h3>
                    <div className="flex items-start gap-6">
                        {/* Preview */}
                        <div className="relative flex-shrink-0">
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Student preview"
                                        className="w-32 h-40 object-cover rounded-lg border-2 border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-32 h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2">
                                    <Camera className="h-8 w-8 text-gray-400" />
                                    <span className="text-xs text-gray-400 text-center">No photo</span>
                                </div>
                            )}
                        </div>

                        {/* Upload area */}
                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                                id="photo-upload"
                            />
                            <label
                                htmlFor="photo-upload"
                                className="cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                            >
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600">Click to upload student photo</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                <p className="text-xs text-gray-400">Recommended: clear face photo (ID style)</p>
                            </label>

                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                ⚠️ This photo will be shown to cashiers during payment to verify the student's identity.
                            </p>
                        </div>
                    </div>
                </div>

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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black outline-none" placeholder="Confirm password" />
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
                        {loading ? (photoUploading ? 'Uploading photo...' : 'Saving...') : 'Create Student'}
                    </button>
                </div>

            </form>
        </div>
    )
}