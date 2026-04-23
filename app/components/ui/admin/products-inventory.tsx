import { useEffect, useRef, useState } from "react";
import { Edit2, Link, Loader, Search, Trash2, Upload, X } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/configs/firebase";
import {
	addProduct,
	deleteProduct,
	subscribeToProducts,
	updateProduct,
} from "@/configs/productService";
import type { Product } from "@/configs/productService";
import { SystemDialog } from "@/components/ui/admin/system-dialog";
import { AdminPrimaryButton } from "@/components/ui/admin/admin-primary-button";

const CLOUDINARY_CLOUD_NAME = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET = "edutap_student_photos";

interface DialogState {
	isOpen: boolean;
	title: string;
	message: string;
	variant: "info" | "success" | "danger";
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm?: () => void;
}

export function ProductsInventory() {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [imageMode, setImageMode] = useState<"url" | "upload">("url");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
	const [dialog, setDialog] = useState<DialogState>({
		isOpen: false,
		title: "",
		message: "",
		variant: "info",
		confirmLabel: "OK",
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState({
		name: "",
		category: "",
		price: "",
		imageUrl: "",
		isAvailable: true,
	});

	const closeDialog = () =>
		setDialog((current) => ({
			...current,
			isOpen: false,
			onConfirm: undefined,
		}));

	const showNotice = (
		title: string,
		message: string,
		variant: "info" | "success" | "danger" = "info",
	) => {
		setDialog({
			isOpen: true,
			title,
			message,
			variant,
			confirmLabel: "Got it",
		});
	};

	const showConfirm = (
		title: string,
		message: string,
		onConfirm: () => void,
		confirmLabel = "Continue",
	) => {
		setDialog({
			isOpen: true,
			title,
			message,
			variant: "danger",
			confirmLabel,
			cancelLabel: "Cancel",
			onConfirm: () => {
				closeDialog();
				onConfirm();
			},
		});
	};

	useEffect(() => {
		setLoading(true);
		const unsubscribe = subscribeToProducts((data) => {
			setProducts(data);
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
		const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
			setCategories(
				snapshot.docs
					.map((categoryDoc) => String(categoryDoc.data().name ?? "").trim())
					.filter(Boolean),
			);
		});

		return unsubscribe;
	}, []);

	const filteredProducts = products.filter(
		(product) =>
			product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.category.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const availableCategories =
		formData.category && !categories.includes(formData.category)
			? [...categories, formData.category]
			: categories;

	const uploadToCloudinary = async (file: File): Promise<string> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

		const response = await fetch(
			`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
			{ method: "POST", body: formData },
		);

		if (!response.ok) {
			throw new Error("Failed to upload image to Cloudinary");
		}

		return (await response.json()).secure_url;
	};

	const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setFormData((current) => ({ ...current, imageUrl: "" }));
	};

	const clearImage = () => {
		setImageFile(null);
		setImagePreview(null);
		setFormData((current) => ({ ...current, imageUrl: "" }));
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleAddClick = () => {
		setEditingId(null);
		setFormData({ name: "", category: "", price: "", imageUrl: "", isAvailable: true });
		setImageMode("url");
		setImageFile(null);
		setImagePreview(null);
		setShowForm(true);
	};

	const handleEditClick = (product: Product) => {
		setEditingId(product.id);
		setFormData({
			name: product.name,
			category: product.category,
			price: product.price.toString(),
			imageUrl: product.imageUrl,
			isAvailable: product.isAvailable ?? true,
		});
		const isUrl = product.imageUrl?.startsWith("http");
		setImageMode("url");
		setImageFile(null);
		setImagePreview(isUrl ? product.imageUrl : null);
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		showConfirm(
			"Delete Product",
			"Are you sure you want to delete this product?",
			() => {
				void (async () => {
					try {
						setSaving(true);
						await deleteProduct(id);
						showNotice("Product Deleted", "Product deleted successfully!", "success");
					} catch (error) {
						showNotice("Delete Failed", "Error deleting product: " + error, "danger");
					} finally {
						setSaving(false);
					}
				})();
			},
			"Delete",
		);
	};

	const handleToggleAvailability = async (product: Product) => {
		const nextValue = !(product.isAvailable ?? true);
		const previousProducts = products;

		try {
			setTogglingProductId(product.id);
			setProducts((current) =>
				current.map((currentProduct) =>
					currentProduct.id === product.id
						? { ...currentProduct, isAvailable: nextValue }
						: currentProduct,
				),
			);
			await updateProduct(product.id, {
				name: product.name,
				price: product.price,
				category: product.category,
				imageUrl: product.imageUrl,
				isAvailable: nextValue,
			});
			showNotice(
				"Product Availability Updated",
				`${product.name} is now ${nextValue ? "available" : "unavailable"} in POS.`,
				"success",
			);
		} catch (error) {
			setProducts(previousProducts);
			showNotice(
				"Availability Update Failed",
				"Unable to update product availability: " + error,
				"danger",
			);
		} finally {
			setTogglingProductId(null);
		}
	};

	const handleSubmit = async () => {
		if (!formData.name || !formData.price || !formData.category) {
			showNotice("Incomplete Form", "Please fill in all fields.", "danger");
			return;
		}

		if (imageMode === "url" && !formData.imageUrl) {
			showNotice("Missing Image", "Please enter an image label or URL.", "danger");
			return;
		}

		if (imageMode === "upload" && !imageFile && !imagePreview) {
			showNotice("Missing Image", "Please upload an image.", "danger");
			return;
		}

		try {
			setSaving(true);

			let finalImageUrl = formData.imageUrl;
			if (imageMode === "upload" && imageFile) {
				setUploading(true);
				finalImageUrl = await uploadToCloudinary(imageFile);
				setUploading(false);
			}

			if (editingId) {
				await updateProduct(editingId, {
					name: formData.name,
					price: parseFloat(formData.price),
					category: formData.category,
					imageUrl: finalImageUrl,
					isAvailable: formData.isAvailable,
				});
				showNotice("Product Updated", "Product updated successfully!", "success");
			} else {
				await addProduct({
					name: formData.name,
					price: parseFloat(formData.price),
					category: formData.category,
					imageUrl: finalImageUrl,
					isAvailable: formData.isAvailable,
				});
				showNotice("Product Added", "Product added successfully!", "success");
			}

			setShowForm(false);
			setFormData({ name: "", category: "", price: "", imageUrl: "", isAvailable: true });
			clearImage();
		} catch (error) {
			showNotice("Save Failed", "Error saving product: " + error, "danger");
		} finally {
			setSaving(false);
			setUploading(false);
		}
	};

	return (
		<>
			<div className="settings-enter settings-delay-2 admin-surface overflow-hidden">
				<div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">Products Inventory</h2>
						<p className="mt-1 text-sm text-gray-500">
							Manage product details, visibility, and category alignment.
						</p>
					</div>
					<AdminPrimaryButton onClick={handleAddClick} disabled={loading || saving}>
						Add Product
					</AdminPrimaryButton>
				</div>

				<div className="p-6">
					{loading ? (
						<div className="flex h-48 items-center justify-center text-gray-500">
							<Loader className="h-6 w-6 animate-spin mr-2" />
							Loading products...
						</div>
					) : (
						<>
							<div className="relative mb-4">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search by product name or category..."
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery("")}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
										x
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
									{searchQuery
										? `No products found for "${searchQuery}"`
										: "No products yet."}
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
													Image
												</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
													Product Name
												</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
													Category
												</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
													Price
												</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
													Availability
												</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{filteredProducts.map((product) => (
												<tr
													key={product.id}
													className="border-b border-gray-100 transition-colors duration-300 hover:bg-red-50/40">
													<td className="py-3 px-4">
														{product.imageUrl?.startsWith("http") ? (
															<img
																src={product.imageUrl}
																alt={product.name}
																className="w-10 h-10 rounded-lg object-cover border border-gray-200"
															/>
														) : (
															<span className="text-sm text-gray-700">
																{product.imageUrl}
															</span>
														)}
													</td>
													<td className="py-3 px-4 text-sm font-medium">
														{product.name}
													</td>
													<td className="py-3 px-4 text-sm">
														{product.category}
													</td>
													<td className="py-3 px-4 text-sm">
														PHP {product.price.toFixed(2)}
													</td>
													<td className="py-3 px-4">
														<button
															type="button"
															onClick={() =>
																void handleToggleAvailability(
																	product,
																)
															}
															disabled={
																togglingProductId === product.id
															}
															className={`inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 disabled:opacity-50 ${
																(product.isAvailable ?? true)
																	? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
																	: "bg-gray-200 text-gray-700 hover:bg-gray-300"
															}`}>
															{togglingProductId === product.id && (
																<Loader className="h-3 w-3 animate-spin" />
															)}
															{(product.isAvailable ?? true)
																? "Available"
																: "Unavailable"}
														</button>
													</td>
													<td className="py-3 px-4">
														<div className="flex gap-2">
															<button
																onClick={() =>
																	handleEditClick(product)
																}
																disabled={saving}
																className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 disabled:opacity-50 disabled:hover:translate-y-0">
																<Edit2 className="w-3 h-3" /> Edit
															</button>
															<button
																onClick={() =>
																	handleDelete(product.id)
																}
																disabled={saving}
																className="flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-200 disabled:opacity-50 disabled:hover:translate-y-0">
																<Trash2 className="w-3 h-3" />{" "}
																Delete
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

				{showForm && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
						<div className="settings-enter max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-2xl font-bold">
									{editingId ? "Edit Product" : "Add New Product"}
								</h3>
								<button
									onClick={() => setShowForm(false)}
									disabled={saving}
									className="rounded-xl p-1 text-gray-400 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50">
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium mb-1">
										Product Name *
									</label>
									<input
										type="text"
										placeholder="e.g., Rice Meal w/ Fried Egg"
										value={formData.name}
										onChange={(event) =>
											setFormData({ ...formData, name: event.target.value })
										}
										disabled={saving}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-1">
										Price (PHP) *
									</label>
									<input
										type="number"
										placeholder="e.g., 65.00"
										value={formData.price}
										onChange={(event) =>
											setFormData({ ...formData, price: event.target.value })
										}
										disabled={saving}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-1">
										Category *
									</label>
									<select
										value={formData.category}
										onChange={(event) =>
											setFormData({
												...formData,
												category: event.target.value,
											})
										}
										disabled={saving}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50">
										<option value="">Select a category...</option>
										{availableCategories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
									{availableCategories.length === 0 && (
										<p className="mt-1 text-xs text-amber-700">
											Add categories in Settings before creating products.
										</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium mb-2">
										POS Availability
									</label>
									<div className="flex overflow-hidden rounded-2xl border border-gray-300">
										<button
											type="button"
											onClick={() =>
												setFormData((current) => ({
													...current,
													isAvailable: true,
												}))
											}
											className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 ${
												formData.isAvailable
													? "bg-emerald-600 text-white"
													: "bg-white text-gray-600 hover:bg-gray-50"
											}`}>
											Available
										</button>
										<button
											type="button"
											onClick={() =>
												setFormData((current) => ({
													...current,
													isAvailable: false,
												}))
											}
											className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 ${
												!formData.isAvailable
													? "bg-gray-700 text-white"
													: "bg-white text-gray-600 hover:bg-gray-50"
											}`}>
											Unavailable
										</button>
									</div>
									<p className="mt-1 text-xs text-gray-500">
										Controls whether this product can be used in POS.
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2">
										Product Image *
									</label>

									<div className="mb-3 flex overflow-hidden rounded-2xl border border-gray-300">
										<button
											type="button"
											onClick={() => {
												setImageMode("url");
												clearImage();
											}}
											className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-300 ${
												imageMode === "url"
													? "bg-red-950 text-white"
													: "bg-white text-gray-600 hover:bg-gray-50"
											}`}>
											<Link className="w-4 h-4" />
											URL / Label
										</button>
										<button
											type="button"
											onClick={() => {
												setImageMode("upload");
												setFormData((current) => ({
													...current,
													imageUrl: "",
												}));
											}}
											className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-300 ${
												imageMode === "upload"
													? "bg-red-950 text-white"
													: "bg-white text-gray-600 hover:bg-gray-50"
											}`}>
											<Upload className="w-4 h-4" />
											Upload Image
										</button>
									</div>

									{imageMode === "url" && (
										<div>
											<input
												type="text"
												placeholder="e.g., Burger or https://res.cloudinary.com/..."
												value={formData.imageUrl}
												onChange={(event) =>
													setFormData({
														...formData,
														imageUrl: event.target.value,
													})
												}
												disabled={saving}
												className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
											/>
											<p className="text-xs text-gray-500 mt-1">
												Use a short label or paste a Cloudinary/image URL.
											</p>
											{formData.imageUrl?.startsWith("http") && (
												<img
													src={formData.imageUrl}
													alt="preview"
													className="mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200"
													onError={(event) =>
														(event.currentTarget.style.display = "none")
													}
												/>
											)}
										</div>
									)}

									{imageMode === "upload" && (
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
														className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
														<X className="h-3 w-3" />
													</button>
												</div>
											) : (
												<label
													htmlFor="product-image"
													className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/40">
													<Upload className="w-6 h-6 text-gray-400 mb-1" />
													<span className="text-sm text-gray-500">
														Click to upload image
													</span>
													<span className="text-xs text-gray-400">
														PNG, JPG, WEBP
													</span>
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
													{imageFile.name} - Will upload to Cloudinary on
													save
												</p>
											)}
										</div>
									)}
								</div>
							</div>

							<div className="flex gap-2 mt-6">
								<button
									onClick={() => {
										setShowForm(false);
										clearImage();
									}}
									disabled={saving}
									className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 disabled:opacity-50 disabled:hover:translate-y-0">
									Cancel
								</button>
								<button
									onClick={handleSubmit}
									disabled={saving || uploading}
									className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-950 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
									{uploading ? (
										<>
											<Loader className="w-4 h-4 animate-spin" /> Uploading...
										</>
									) : saving ? (
										"Saving..."
									) : editingId ? (
										"Update Product"
									) : (
										"Add Product"
									)}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
			<SystemDialog
				isOpen={dialog.isOpen}
				title={dialog.title}
				message={dialog.message}
				variant={dialog.variant}
				confirmLabel={dialog.confirmLabel}
				cancelLabel={dialog.cancelLabel}
				onClose={closeDialog}
				onConfirm={dialog.onConfirm}
			/>
		</>
	);
}
