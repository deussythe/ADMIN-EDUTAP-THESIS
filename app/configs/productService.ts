import { db } from "./firebase"
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore"

export interface Product {
    id: string
    name: string
    price: number
    category: string
    imageUrl: string
    isAvailable?: boolean
    createdAt?: number
}

const normalizeProduct = (
    id: string,
    data: Partial<Product> & Record<string, unknown>
): Product => ({
    id,
    name: String(data.name ?? ""),
    price: Number(data.price ?? 0),
    category: String(data.category ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    isAvailable: data.isAvailable !== false,
    createdAt: typeof data.createdAt === "number" ? data.createdAt : undefined,
})

// Real-time listener for all products
export const subscribeToProducts = (
    callback: (products: Product[]) => void
) => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"))
    return onSnapshot(
        q,
        (snapshot) => {
            const data = snapshot.docs.map((snapshotDoc) =>
                normalizeProduct(snapshotDoc.id, snapshotDoc.data() as Record<string, unknown>)
            )
            callback(data)
        },
        (error) => {
            console.error("Error subscribing to products:", error)
            callback([]) // Return empty array on error to prevent crash
        }
    )
}

export const subscribeToAvailableProducts = (
    callback: (products: Product[]) => void
) => {
    return subscribeToProducts((products) => {
        callback(products.filter((product) => product.isAvailable !== false))
    })
}

// Add new product
export const addProduct = async (product: Omit<Product, "id" | "createdAt">) => {
    return await addDoc(collection(db, "products"), {
        ...product,
        isAvailable: product.isAvailable ?? true,
        createdAt: Date.now(),
    })
}

// Update existing product
export const updateProduct = async (id: string, product: Omit<Product, "id" | "createdAt">) => {
    const productRef = doc(db, "products", id)
    await updateDoc(productRef, {
        ...product,
        isAvailable: product.isAvailable ?? true,
    })
}

export const setProductAvailability = async (id: string, isAvailable: boolean) => {
    await updateDoc(doc(db, "products", id), { isAvailable })
}

// Delete product
export const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id))
}
