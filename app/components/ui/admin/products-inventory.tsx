import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Loader, Search, Upload, Link, X } from 'lucide-react'
import {
    subscribeToProducts,
    addProduct,
    updateProduct,
    deleteProduct
} from '@/configs/productService'
import type { Product } from '@/configs/productService'

const CLOUDINARY_CLOUD_NAME = "dvjilvllm"
const CLOUDINARY_UPLOAD_PRESET = "edutap_student_photos"

const CATEGORIES = [
    "Beverages", "Bakery", "Snacks", "Dessert", "Lunch/Heavy",
    "Silog Meal", "Noodles", "Street Food", "Kakanin/Dessert",
    "Grill/Snacks", "School Supplies", "Local Juices/Shakes",
]

export function ProductsInventory() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Image state
    const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        imageUrl: '',
    })

    useEffect(() => {
        setLoading(true)
        const unsubscribe = subscribeToProducts((data) => {
            setProducts(data)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ─── Cloudinary upload ─────────────────────────────────────────────────
    const uploadToCloudinary = async (file: File): Promise<string> => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: fd }
        )
        if (!res.ok) throw new Error('Failed to upload image to Cloudinary')
        return (await res.json()).secure_url
    }

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        setFormData(prev => ({ ...prev, imageUrl: '' }))
    }

    const clearImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setFormData(prev => ({ ...prev, imageUrl: '' }))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ─── Open forms ────────────────────────────────────────────────────────
    const handleAddClick = () => {
        setEditingId(null)
        setFormData({ name: '', category: '', price: '', imageUrl: '' })
        setImageMode('url')
        setImageFile(null)
        setImagePreview(null)
        setShowForm(true)
    }

    const handleEditClick = (product: Product) => {
        setEditingId(product.id)
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            imageUrl: product.imageUrl,
        })
        // If existing imageUrl is a real URL (not emoji), show it as preview
        const isUrl = product.imageUrl?.startsWith('http')
        setImageMode(isUrl ? 'url' : 'url')
        setImageFile(null)
        setImagePreview(isUrl ? product.imageUrl : null)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                setSaving(true)
                await deleteProduct(id)
                alert('Product deleted successfully!')
            } catch (error) {
                alert('Error deleting product: ' + error)
            } finally {
                setSaving(false)
            }
        }
    }

    // ─── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            alert('Please fill in all fields')
            return
        }

        // Must have either a URL/emoji or an uploaded file
        if (imageMode === 'url' && !formData.imageUrl) {
            alert('Please enter an image URL or emoji')
            return
        }
        if (imageMode === 'upload' && !imageFile && !imagePreview) {
            alert('Please upload an image')
            return
        }

        try {
            setSaving(true)

            let finalImageUrl = formData.imageUrl

            // Upload to Cloudinary if file was selected
            if (imageMode === 'upload' && imageFile) {
                setUploading(true)
                finalImageUrl = await uploadToCloudinary(imageFile)
                setUploading(false)
            }

            if (editingId) {
                await updateProduct(editingId, {
                    name: formData.name,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    imageUrl: finalImageUrl,
                })
                alert('Product updated!')
            } else {
                await addProduct({
                    name: formData.name,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    imageUrl: finalImageUrl,
                })
                alert('Product added!')
            }
            setShowForm(false)
            setFormData({ name: '', category: '', price: '', imageUrl: '' })
            clearImage()
        } catch (error) {
            alert('Error saving product: ' + error)
        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Products Inventory</h2>
                <button
                    onClick={handleAddClick}
                    disabled={loading || saving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-950 border-b rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-white"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex h-48 items-center justify-center text-gray-500">
                        <Loader className="h-6 w-6 animate-spin mr-2" />
                        Loading products...
                    </div>
                ) : (
                    <>
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by product name or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <p className="text-gray-600 mb-4 text-sm">
                            {searchQuery
                                ? `${filteredProducts.length} result(s) for "${searchQuery}"`
                                : `Total Products: ${products.length}`}
                        </p>

                        {filteredProducts.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-gray-400 text-sm">
                                {searchQuery ? `No products found for "${searchQuery}"` : 'No products yet.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Image</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    {product.imageUrl?.startsWith('http') ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">{product.imageUrl}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                                                <td className="py-3 px-4 text-sm">{product.category}</td>
                                                <td className="py-3 px-4 text-sm">₱{product.price.toFixed(2)}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(product)}
                                                            disabled={saving}
                                                            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                                        >
                                                            <Edit2 className="w-3 h-3" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            disabled={saving}
                                                            className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold">
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                disabled={saving}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Rice Meal w/ Fried Egg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={saving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Price (₱) *</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 65.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    disabled={saving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    disabled={saving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                >
                                    <option value="">Select a category...</option>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Image Section */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Product Image *</label>

                                {/* Toggle tabs */}
                                <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
                                    <button
                                        type="button"
                                        onClick={() => { setImageMode('url'); clearImage() }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                                            imageMode === 'url'
                                                ? 'bg-red-950 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Link className="w-4 h-4" />
                                        URL / Emoji
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setImageMode('upload'); setFormData(prev => ({ ...prev, imageUrl: '' })) }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                                            imageMode === 'upload'
                                                ? 'bg-red-950 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload Image
                                    </button>
                                </div>

                                {/* URL / Emoji input */}
                                {imageMode === 'url' && (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="e.g., 🍚 or https://res.cloudinary.com/..."
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            disabled={saving}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Use an emoji (🍚🥤🍞) or paste a Cloudinary/image URL
                                        </p>
                                        {/* Preview if URL */}
                                        {formData.imageUrl?.startsWith('http') && (
                                            <img
                                                src={formData.imageUrl}
                                                alt="preview"
                                                className="mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* File upload */}
                                {imageMode === 'upload' && (
                                    <div>
                                        {imagePreview ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={imagePreview}
                                                    alt="preview"
                                                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={clearImage}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="product-image"
                                                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                                <span className="text-sm text-gray-500">Click to upload image</span>
                                                <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
                                            </label>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            id="product-image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                            className="hidden"
                                        />
                                        {imageFile && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {imageFile.name} · Will upload to Cloudinary on save
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => { setShowForm(false); clearImage() }}
                                disabled={saving}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving || uploading}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-950 border-b rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <><Loader className="w-4 h-4 animate-spin" /> Uploading...</>
                                ) : saving ? (
                                    'Saving...'
                                ) : editingId ? (
                                    'Update Product'
                                ) : (
                                    'Add Product'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}