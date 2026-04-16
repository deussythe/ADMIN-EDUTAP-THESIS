import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader, Search } from 'lucide-react'
import {
    subscribeToProducts,
    addProduct,
    updateProduct,
    deleteProduct
} from '@/configs/productService'
import type { Product } from '@/configs/productService'

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
    const [searchQuery, setSearchQuery] = useState('')  // 🔍 Search state
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

    // 🔍 Filter products by name or category
    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAddClick = () => {
        setEditingId(null)
        setFormData({ name: '', category: '', price: '', imageUrl: '' })
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

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.category || !formData.imageUrl) {
            alert('Please fill in all fields')
            return
        }

        try {
            setSaving(true)
            if (editingId) {
                await updateProduct(editingId, {
                    name: formData.name,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                })
                alert('Product updated!')
            } else {
                await addProduct({
                    name: formData.name,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                })
                alert('Product added!')
            }
            setShowForm(false)
            setFormData({ name: '', category: '', price: '', imageUrl: '' })
        } catch (error) {
            alert('Error saving product: ' + error)
        } finally {
            setSaving(false)
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
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                        {/* 🔍 Search Bar */}
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
                                                <td className="py-3 px-4 text-2xl">{product.imageUrl}</td>
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
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold">
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                disabled={saving}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50"
                            >
                                ×
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

                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL or Emoji *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 🍚 or https://cloudinary.com/..."
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    disabled={saving}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">Use emoji (🍚) or Cloudinary image URL</p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                disabled={saving}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}