"use client"

import { useState, useEffect, useRef } from "react"
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { db } from "@/configs/firebase"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
    id: string
    name: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: {
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    )
}

function SaveButton({ saving, saved, onClick, label = "Save Changes" }: {
    saving: boolean
    saved: boolean
    onClick: () => void
    label?: string
}) {
    return (
        <button
            onClick={onClick}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-red-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-900 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
            {saving ? (
                <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                </>
            ) : saved ? (
                <>✅ Saved!</>
            ) : (
                label
            )}
        </button>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsPage() {
    // ── Canteen Info ──
    const [schoolName, setSchoolName] = useState("")
    const [canteenName, setCanteenName] = useState("")
    const [savingInfo, setSavingInfo] = useState(false)
    const [savedInfo, setSavedInfo] = useState(false)

    // ── Transaction Control ──
    const [transactionsEnabled, setTransactionsEnabled] = useState(true)
    const [savingTx, setSavingTx] = useState(false)
    const [savedTx, setSavedTx] = useState(false)

    // ── Branding ──
    const [themeColor, setThemeColor] = useState("#7f1d1d")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [faviconFile, setFaviconFile] = useState<File | null>(null)
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
    const [loginBgType, setLoginBgType] = useState<"color" | "image">("color")
    const [loginBgColor, setLoginBgColor] = useState("#ffffff")
    const [loginBgFile, setLoginBgFile] = useState<File | null>(null)
    const [loginBgPreview, setLoginBgPreview] = useState<string | null>(null)
    const [savingBranding, setSavingBranding] = useState(false)
    const [savedBranding, setSavedBranding] = useState(false)
    const logoRef = useRef<HTMLInputElement>(null)
    const faviconRef = useRef<HTMLInputElement>(null)
    const loginBgRef = useRef<HTMLInputElement>(null)

    // ── Categories ──
    const [categories, setCategories] = useState<Category[]>([])
    const [newCategoryName, setNewCategoryName] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")
    const [categoryError, setCategoryError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [addingCategory, setAddingCategory] = useState(false)

    // ── Loading ──
    const [loading, setLoading] = useState(true)

    // ─── Fetch on mount ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Canteen info
                const infoSnap = await getDoc(doc(db, "settings", "canteen_info"))
                if (infoSnap.exists()) {
                    const d = infoSnap.data()
                    setSchoolName(d.schoolName ?? "")
                    setCanteenName(d.canteenName ?? "")
                }

                // Transaction control
                const txSnap = await getDoc(doc(db, "settings", "transaction_control"))
                if (txSnap.exists()) {
                    setTransactionsEnabled(txSnap.data().enabled ?? true)
                }

                // Branding
                const brandSnap = await getDoc(doc(db, "settings", "branding"))
                if (brandSnap.exists()) {
                    const b = brandSnap.data()
                    if (b.themeColor) setThemeColor(b.themeColor)
                    if (b.logoUrl) setLogoPreview(b.logoUrl)
                    if (b.faviconUrl) setFaviconPreview(b.faviconUrl)
                    if (b.loginBgType) setLoginBgType(b.loginBgType)
                    if (b.loginBgColor) setLoginBgColor(b.loginBgColor)
                    if (b.loginBgUrl) setLoginBgPreview(b.loginBgUrl)
                }

                // Categories
                const catSnap = await getDocs(collection(db, "categories"))
                setCategories(catSnap.docs.map(d => ({ id: d.id, name: d.data().name })))
            } catch (err) {
                console.error("Failed to load settings:", err)
            }
            setLoading(false)
        }
        fetchAll()
    }, [])

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleSaveInfo = async () => {
        setSavingInfo(true)
        await setDoc(doc(db, "settings", "canteen_info"), { schoolName, canteenName })
        setSavingInfo(false)
        setSavedInfo(true)
        setTimeout(() => setSavedInfo(false), 2500)
    }

    const handleToggleTransactions = async () => {
        const next = !transactionsEnabled
        setSavingTx(true)
        setTransactionsEnabled(next)
        await setDoc(doc(db, "settings", "transaction_control"), { enabled: next })
        setSavingTx(false)
        setSavedTx(true)
        setTimeout(() => setSavedTx(false), 2500)
    }

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setFile: (f: File) => void,
        setPreview: (s: string) => void
    ) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleSaveBranding = async () => {
        setSavingBranding(true)
        // In production you'd upload files to Storage and get URLs.
        // Here we save the preview data-URLs as placeholders.
        await setDoc(doc(db, "settings", "branding"), {
            themeColor,
            logoUrl: logoPreview ?? null,
            faviconUrl: faviconPreview ?? null,
            loginBgType,
            loginBgColor,
            loginBgUrl: loginBgPreview ?? null,
        })
        setSavingBranding(false)
        setSavedBranding(true)
        setTimeout(() => setSavedBranding(false), 2500)
    }

    const handleAddCategory = async () => {
        const trimmed = newCategoryName.trim()
        if (!trimmed) return
        setAddingCategory(true)
        setCategoryError(null)
        try {
            const ref = await addDoc(collection(db, "categories"), { name: trimmed })
            setCategories(prev => [...prev, { id: ref.id, name: trimmed }])
            setNewCategoryName("")
        } catch {
            setCategoryError("Failed to add category. Please try again.")
        }
        setAddingCategory(false)
    }

    const handleEditSave = async (id: string) => {
        const trimmed = editingName.trim()
        if (!trimmed) return
        await updateDoc(doc(db, "categories", id), { name: trimmed })
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c))
        setEditingId(null)
    }

    const handleDeleteCategory = async (id: string, name: string) => {
        setCategoryError(null)
        setDeletingId(id)
        try {
            // Safety check: look for products using this category
            const productsSnap = await getDocs(
                query(collection(db, "products"), where("category", "==", name))
            )
            if (!productsSnap.empty) {
                setCategoryError(`Cannot delete "${name}" — it still has ${productsSnap.size} product(s) assigned to it. Reassign or delete those products first.`)
                setDeletingId(null)
                return
            }
            await deleteDoc(doc(db, "categories", id))
            setCategories(prev => prev.filter(c => c.id !== id))
        } catch {
            setCategoryError("Failed to delete category.")
        }
        setDeletingId(null)
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
            Loading settings…
        </div>
    )

    return (
        <div className="max-w-3xl space-y-6 pb-12">

            {/* ── Header ── */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your system-wide configuration, branding, and content.</p>
            </div>

            {/* ════════════════════════════════════════════════
                1. TRANSACTION CONTROL
            ════════════════════════════════════════════════ */}
            <SectionCard
                title="Global Transaction Controls"
                description="Enable or disable all transactions system-wide. Use for maintenance or emergency lockdown."
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-800">All Transactions</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {transactionsEnabled
                                ? "System is live — students can transact normally."
                                : "⚠️ Transactions are currently disabled for all users."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${transactionsEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {transactionsEnabled ? "ENABLED" : "DISABLED"}
                        </span>
                        <button
                            onClick={handleToggleTransactions}
                            disabled={savingTx}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 ${transactionsEnabled ? "bg-red-950" : "bg-gray-300"}`}
                            role="switch"
                            aria-checked={transactionsEnabled}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${transactionsEnabled ? "translate-x-5" : "translate-x-0"}`}
                            />
                        </button>
                    </div>
                </div>
                {savedTx && (
                    <p className="text-xs text-green-600 mt-3">✅ Transaction setting saved.</p>
                )}
            </SectionCard>

            {/* ════════════════════════════════════════════════
                2. BRANDING & IDENTITY
            ════════════════════════════════════════════════ */}
            <SectionCard
                title="Branding & Identity"
                description="Customize the visual appearance of your EDUTAP instance."
            >
                <div className="space-y-6">

                    {/* Theme Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={themeColor}
                                    onChange={e => setThemeColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white"
                                />
                            </div>
                            <input
                                type="text"
                                value={themeColor}
                                onChange={e => setThemeColor(e.target.value)}
                                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-950/30"
                                placeholder="#7f1d1d"
                            />
                            <div
                                className="flex-1 h-10 rounded-lg border border-gray-200"
                                style={{ background: themeColor }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Affects buttons, sidebar highlights, and headers.</p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* School & Canteen Name (also in Branding) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
                            <input
                                type="text"
                                value={schoolName}
                                onChange={e => setSchoolName(e.target.value)}
                                placeholder="e.g. St. Clare College of Caloocan"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-950/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Canteen Name</label>
                            <input
                                type="text"
                                value={canteenName}
                                onChange={e => setCanteenName(e.target.value)}
                                placeholder="e.g. School Canteen"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-950/30"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* File Uploads */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                        {/* Logo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                            <div
                                onClick={() => logoRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-2 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-red-950/40 hover:bg-red-50/20 transition-colors"
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="max-h-20 max-w-full object-contain rounded" />
                                ) : (
                                    <>
                                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs text-gray-400">Click to upload</span>
                                    </>
                                )}
                            </div>
                            <input ref={logoRef} type="file" accept="image/*" className="hidden"
                                onChange={e => handleFileChange(e, setLogoFile, setLogoPreview)} />
                            <p className="text-xs text-gray-400 mt-1">Replaces the EDUTAP logo</p>
                        </div>

                        {/* Favicon */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                            <div
                                onClick={() => faviconRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-2 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-red-950/40 hover:bg-red-50/20 transition-colors"
                            >
                                {faviconPreview ? (
                                    <img src={faviconPreview} alt="Favicon" className="w-12 h-12 object-contain" />
                                ) : (
                                    <>
                                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs text-gray-400">Click to upload</span>
                                    </>
                                )}
                            </div>
                            <input ref={faviconRef} type="file" accept="image/x-icon,image/png,image/svg+xml" className="hidden"
                                onChange={e => handleFileChange(e, setFaviconFile, setFaviconPreview)} />
                            <p className="text-xs text-gray-400 mt-1">Browser tab icon (.ico, .png)</p>
                        </div>

                        {/* Login Background */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Login Background</label>
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setLoginBgType("color")}
                                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${loginBgType === "color" ? "bg-red-950 text-white border-red-950" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}
                                >Color</button>
                                <button
                                    onClick={() => setLoginBgType("image")}
                                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${loginBgType === "image" ? "bg-red-950 text-white border-red-950" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}
                                >Image</button>
                            </div>
                            {loginBgType === "color" ? (
                                <div className="flex items-center gap-2">
                                    <input type="color" value={loginBgColor}
                                        onChange={e => setLoginBgColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                                    <input type="text" value={loginBgColor}
                                        onChange={e => setLoginBgColor(e.target.value)}
                                        className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-950/30" />
                                </div>
                            ) : (
                                <div
                                    onClick={() => loginBgRef.current?.click()}
                                    className="flex flex-col items-center justify-center gap-2 h-[4.5rem] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-red-950/40 hover:bg-red-50/20 transition-colors overflow-hidden"
                                    style={loginBgPreview ? { backgroundImage: `url(${loginBgPreview})`, backgroundSize: "cover" } : {}}
                                >
                                    {!loginBgPreview && (
                                        <>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            <span className="text-xs text-gray-400">Upload image</span>
                                        </>
                                    )}
                                </div>
                            )}
                            <input ref={loginBgRef} type="file" accept="image/*" className="hidden"
                                onChange={e => handleFileChange(e, setLoginBgFile, setLoginBgPreview)} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <SaveButton
                            saving={savingBranding}
                            saved={savedBranding}
                            onClick={async () => {
                                await handleSaveInfo()
                                await handleSaveBranding()
                            }}
                            label="Save Branding & Info"
                        />
                    </div>
                </div>
            </SectionCard>

            {/* ════════════════════════════════════════════════
                3. CATEGORY MANAGER
            ════════════════════════════════════════════════ */}
            <SectionCard
                title="Category Manager"
                description="Manage product categories. Categories with assigned products cannot be deleted."
            >
                {/* Add New */}
                <div className="flex gap-2 mb-5">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAddCategory() }}
                        placeholder="New category name…"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-950/30"
                    />
                    <button
                        onClick={handleAddCategory}
                        disabled={addingCategory || !newCategoryName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {addingCategory ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                        Add
                    </button>
                </div>

                {/* Error Banner */}
                {categoryError && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                        <svg className="w-4 h-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{categoryError}</p>
                        <button onClick={() => setCategoryError(null)} className="ml-auto text-red-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Category List */}
                {categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                        No categories yet. Add one above.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-2.5 group hover:bg-white hover:border-gray-200 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-red-950/60 shrink-0" />

                                {editingId === cat.id ? (
                                    <>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") handleEditSave(cat.id)
                                                if (e.key === "Escape") setEditingId(null)
                                            }}
                                            className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-950/30"
                                        />
                                        <button
                                            onClick={() => handleEditSave(cat.id)}
                                            className="text-xs font-semibold text-green-700 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                        >Save</button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                        >Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingId(cat.id); setEditingName(cat.name); setCategoryError(null) }}
                                                className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                disabled={deletingId === cat.id}
                                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                                title="Delete"
                                            >
                                                {deletingId === cat.id ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin inline-block" />
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

        </div>
    )
}