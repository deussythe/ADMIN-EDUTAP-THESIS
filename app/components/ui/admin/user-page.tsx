"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Phone, Search, X, Edit2, Trash2, Loader } from "lucide-react";
import {
	collection,
	onSnapshot,
	addDoc,
	deleteDoc,
	updateDoc,
	doc,
	query,
	setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/configs/firebase";
import { auth, db } from "@/configs/firebase";
import { SystemDialog } from "@/components/ui/admin/system-dialog";
import { AdminPrimaryButton } from "@/components/ui/admin/admin-primary-button";

const CLOUDINARY_CLOUD_NAME = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET = "edutap_student_photos";

interface Student {
	id: string;
	name: string;
	lrn: string;
	gradeLevel: string;
	schoolEmail: string;
	guardianName: string;
	guardianEmail: string;
	contactNumber: string;
	rfidSerial: string;
	photoUrl: string;
	balance: number;
	status: "Active" | "Inactive";
	createdAt: number;
	guardianId?: string;
}

interface DialogState {
	isOpen: boolean;
	title: string;
	message: string;
	variant: "info" | "success" | "danger";
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm?: () => void;
}

const EMPTY_FORM = {
	name: "",
	gradeLevel: "",
	lrn: "",
	schoolEmail: "",
	guardianName: "",
	guardianEmail: "",
	guardianPassword: "",
	confirmPassword: "",
	contactNumber: "",
	rfidSerial: "",
};

export function StudentPage() {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingStudent, setEditingStudent] = useState<Student | null>(null);
	const [saving, setSaving] = useState(false);
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [formData, setFormData] = useState({ ...EMPTY_FORM });
	const [allowEmailEdit, setAllowEmailEdit] = useState(false);
	const [dialog, setDialog] = useState<DialogState>({
		isOpen: false,
		title: "",
		message: "",
		variant: "info",
		confirmLabel: "OK",
	});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const rfidInputRef = useRef<HTMLInputElement>(null);

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

	// ─── Realtime listener ─────────────────────────────────────────────────
	useEffect(() => {
		const q = query(collection(db, "students"));
		const unsub = onSnapshot(q, (snap) => {
			setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Student));
			setLoading(false);
		});
		return unsub;
	}, []);

	const filtered = students.filter(
		(s) =>
			s.name?.toLowerCase().includes(search.toLowerCase()) ||
			s.lrn?.toLowerCase().includes(search.toLowerCase()) ||
			s.gradeLevel?.toLowerCase().includes(search.toLowerCase()) ||
			s.guardianName?.toLowerCase().includes(search.toLowerCase()),
	);

	// ─── Helpers ───────────────────────────────────────────────────────────
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setPhotoFile(file);
		setPhotoPreview(URL.createObjectURL(file));
	};

	const uploadPhoto = async (file: File): Promise<string> => {
		const fd = new FormData();
		fd.append("file", file);
		fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
		const res = await fetch(
			`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
			{ method: "POST", body: fd },
		);
		if (!res.ok) throw new Error("Failed to upload photo");
		return (await res.json()).secure_url;
	};

	// ─── Get or create the secondary Firebase app (reused, never deleted) ──
	const getSecondaryAuth = () => {
		const secondary =
			getApps().find((app) => app.name === "secondary") ||
			initializeApp(firebaseConfig, "secondary");
		return getAuth(secondary);
	};

	// ─── Open forms ────────────────────────────────────────────────────────
	const openAdd = () => {
		setEditingId(null);
		setEditingStudent(null);
		setAllowEmailEdit(false);
		setFormData({ ...EMPTY_FORM });
		setPhotoFile(null);
		setPhotoPreview(null);
		setShowForm(true);
	};

	const openEdit = (student: Student) => {
		setEditingId(student.id);
		setEditingStudent(student);
		setAllowEmailEdit(false);
		setFormData({
			name: student.name,
			gradeLevel: student.gradeLevel,
			lrn: student.lrn,
			schoolEmail: student.schoolEmail,
			guardianName: student.guardianName,
			guardianEmail: student.guardianEmail,
			guardianPassword: "",
			confirmPassword: "",
			contactNumber: student.contactNumber,
			rfidSerial: student.rfidSerial,
		});
		setPhotoFile(null);
		setPhotoPreview(student.photoUrl || null);
		setShowForm(true);
	};

	// ─── Delete ────────────────────────────────────────────────────────────
	const handleDelete = async (id: string) => {
		showConfirm(
			"Delete Student",
			"Are you sure you want to delete this student?",
			() => {
				void deleteDoc(doc(db, "students", id));
			},
			"Delete",
		);
	};

	// ─── Submit (add or edit) ──────────────────────────────────────────────
	const handleSubmit = async () => {
		if (
			!formData.name ||
			!formData.lrn ||
			!formData.gradeLevel ||
			!formData.guardianName ||
			!formData.guardianEmail ||
			!formData.contactNumber ||
			!formData.rfidSerial
		) {
			showNotice("Incomplete Form", "Please fill in all required fields.", "danger");
			return;
		}

		if (!editingId) {
			if (!formData.guardianPassword) {
				showNotice("Missing Password", "Password is required.", "danger");
				return;
			}
			if (formData.guardianPassword !== formData.confirmPassword) {
				showNotice("Password Mismatch", "Passwords do not match.", "danger");
				return;
			}
			if (formData.guardianPassword.length < 6) {
				showNotice("Weak Password", "Password must be at least 6 characters.", "danger");
				return;
			}
		}

		setSaving(true);
		try {
			let photoUrl = photoPreview || "";
			if (photoFile) photoUrl = await uploadPhoto(photoFile);

			// ── EDIT ──────────────────────────────────────────────────────
			if (editingId && editingStudent) {
				const newEmail = formData.guardianEmail.toLowerCase();
				const oldEmail = editingStudent.guardianEmail?.toLowerCase();
				const emailChanged = allowEmailEdit && newEmail !== oldEmail;

				await updateDoc(doc(db, "students", editingId), {
					name: formData.name,
					gradeLevel: formData.gradeLevel,
					lrn: formData.lrn,
					schoolEmail: formData.schoolEmail,
					guardianName: formData.guardianName,
					guardianEmail: newEmail,
					contactNumber: formData.contactNumber,
					rfidSerial: formData.rfidSerial,
					...(photoFile ? { photoUrl } : {}),
				});

				if (emailChanged && editingStudent.guardianId) {
					await updateDoc(doc(db, "users", editingStudent.guardianId), {
						email: newEmail,
					});
					showNotice("Student Updated", "Guardian email was updated in the database. To update the Firebase Auth login email, deploy the updateGuardianEmail Cloud Function.", "info");
				} else {
					showNotice("Student Updated", "Student updated successfully!", "success");
				}

				// ── ADD ───────────────────────────────────────────────────────
			} else {
				// Use secondary app so the admin auth session is never displaced.
				// The secondary app is persistent (never deleted), so this is safe
				// to call multiple times without "app deleted" errors.
				const secondaryAuth = getSecondaryAuth();

				const userCredential = await createUserWithEmailAndPassword(
					secondaryAuth,
					formData.guardianEmail.toLowerCase(),
					formData.guardianPassword,
				);
				const guardianUid = userCredential.user.uid;

				// Sign out from secondary to keep things tidy
				await secondaryAuth.signOut();

				// Write student doc
				await addDoc(collection(db, "students"), {
					name: formData.name,
					gradeLevel: formData.gradeLevel,
					lrn: formData.lrn,
					schoolEmail: formData.schoolEmail,
					guardianName: formData.guardianName,
					guardianEmail: formData.guardianEmail.toLowerCase(),
					contactNumber: formData.contactNumber,
					rfidSerial: formData.rfidSerial,
					photoUrl,
					balance: 0,
					guardianId: guardianUid,
					status: "Active",
					createdAt: Date.now(),
				});

				// Write guardian user doc (using primary db — admin is still signed in)
				await setDoc(doc(db, "users", guardianUid), {
					name: formData.guardianName,
					email: formData.guardianEmail.toLowerCase(),
					role: "parent",
					studentName: formData.name,
					status: "Active",
					createdAt: Date.now(),
				});

				showNotice("Student Added", "Student created successfully!", "success");
			}

			setShowForm(false);
		} catch (err: any) {
			showNotice("Save Failed", "Error: " + err.message, "danger");
		} finally {
			setSaving(false);
		}
	};

	// ─── Render ────────────────────────────────────────────────────────────
	if (loading)
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
				<Loader className="inline h-5 w-5 animate-spin mr-2" />
				Loading students...
			</div>
		);

	return (
		<>
			<div className="bg-white rounded-lg border border-gray-200 p-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-semibold mb-1">Student Management</h2>
						<p className="text-gray-600">
							Manage student profiles, guardian info, and RFID cards.
						</p>
					</div>
					<AdminPrimaryButton onClick={openAdd}>Add Student</AdminPrimaryButton>
				</div>

				{/* Search */}
				<div className="relative mb-6 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search by name, LRN, grade..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
					/>
					{search && (
						<button
							onClick={() => setSearch("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Student
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Grade
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Guardian
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Contact
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									RFID
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Balance
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-8 text-gray-400">
										{search
											? "No students match your search."
											: "No students yet."}
									</td>
								</tr>
							) : (
								filtered.map((student) => (
									<tr
										key={student.id}
										className="border-b border-gray-100 hover:bg-gray-50">
										<td className="py-4 px-4">
											<div className="flex items-center gap-3">
												{student.photoUrl ? (
													<img
														src={student.photoUrl}
														alt={student.name}
														className="w-10 h-10 rounded-full object-cover border border-gray-200"
													/>
												) : (
													<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
														<Users className="w-5 h-5 text-gray-500" />
													</div>
												)}
												<div>
													<p className="font-medium text-gray-900">
														{student.name}
													</p>
													<p className="text-xs text-gray-500">
														<span className="font-semibold text-gray-600">
															LRN:
														</span>{" "}
														<span className="font-mono">{student.lrn}</span>
													</p>
												</div>
											</div>
										</td>
										<td className="py-4 px-4">
											<span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
												{student.gradeLevel}
											</span>
										</td>
										<td className="py-4 px-4">
											<p className="text-sm font-medium text-gray-900">
												{student.guardianName}
											</p>
											<p className="text-xs text-gray-500">
												{student.guardianEmail}
											</p>
										</td>
										<td className="py-4 px-4">
											<div className="flex items-center gap-1 text-sm text-gray-600">
												<Phone className="w-3.5 h-3.5" />
												{student.contactNumber || "—"}
											</div>
										</td>
										<td className="py-4 px-4">
											<span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
												{student.rfidSerial || "—"}
											</span>
										</td>
										<td className="py-4 px-4 text-sm font-semibold text-gray-900">
											₱{(student.balance ?? 0).toFixed(2)}
										</td>
										<td className="py-4 px-4">
											<div className="flex items-center gap-2">
												<button
													onClick={() => openEdit(student)}
													className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
													<Edit2 className="w-3.5 h-3.5" /> Edit
												</button>
												<button
													onClick={() => handleDelete(student.id)}
													className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
													<Trash2 className="w-3.5 h-3.5" /> Remove
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Add / Edit Modal */}
			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h3 className="text-xl font-semibold">
									{editingId ? "Edit Student" : "Add New Student"}
								</h3>
								<p className="text-sm text-gray-500">
									{editingId
										? "Update student information."
										: "Fill in the details below."}
								</p>
							</div>
							<button
								onClick={() => setShowForm(false)}
								disabled={saving}
								className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Photo */}
						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Student Photo
							</label>
							<div className="flex items-center gap-4">
								{photoPreview ? (
									<div className="relative">
										<img
											src={photoPreview}
											className="w-20 h-24 object-cover rounded-lg border-2 border-gray-300"
										/>
										<button
											type="button"
											onClick={() => {
												setPhotoFile(null);
												setPhotoPreview(null);
											}}
											className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
											<X className="h-3 w-3" />
										</button>
									</div>
								) : (
									<div className="w-20 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
										No photo
									</div>
								)}
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handlePhotoChange}
									className="hidden"
									id="modal-photo"
								/>
								<label
									htmlFor="modal-photo"
									className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
									Upload Photo
								</label>
							</div>
						</div>

						{/* Student Details */}
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
							Student Details
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
							{[
								{ label: "Full Name", name: "name", placeholder: "Juan Dela Cruz" },
								{ label: "LRN", name: "lrn", placeholder: "123456789012" },
								{
									label: "School Email",
									name: "schoolEmail",
									placeholder: "student@school.edu.ph",
								},
							].map((f) => (
								<div
									key={f.name}
									className={f.name === "schoolEmail" ? "sm:col-span-2" : ""}>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										{f.label}
									</label>
									<input
										type="text"
										name={f.name}
										value={(formData as any)[f.name]}
										onChange={handleChange}
										placeholder={f.placeholder}
										disabled={saving}
										className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
									/>
								</div>
							))}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Grade Level
								</label>
								<select
									name="gradeLevel"
									value={formData.gradeLevel}
									onChange={handleChange}
									disabled={saving}
									className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white disabled:opacity-50">
									<option value="">Select Grade Level</option>
									{[
										"Grade 1",
										"Grade 2",
										"Grade 3",
										"Grade 4",
										"Grade 5",
										"Grade 6",
									].map((g) => (
										<option key={g} value={g}>
											{g}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Guardian Info */}
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
							Guardian Information
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
							{[
								{
									label: "Guardian Name",
									name: "guardianName",
									placeholder: "Maria Dela Cruz",
								},
								{
									label: "Contact Number",
									name: "contactNumber",
									placeholder: "09XX XXX XXXX",
								},
							].map((f: any) => (
								<div key={f.name}>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										{f.label}
									</label>
									<input
										type="text"
										name={f.name}
										value={(formData as any)[f.name]}
										onChange={handleChange}
										placeholder={f.placeholder}
										disabled={saving}
										className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
									/>
								</div>
							))}

							{/* Guardian Email */}
							<div className="sm:col-span-2">
								<div className="flex items-center justify-between mb-1">
									<label className="block text-sm font-medium text-gray-700">
										Guardian Email
									</label>
									{editingId && (
										<button
											type="button"
											onClick={() => setAllowEmailEdit((v) => !v)}
											className="text-xs text-blue-600 hover:underline">
											{allowEmailEdit ? "Lock email" : "Change email"}
										</button>
									)}
								</div>
								<input
									type="text"
									name="guardianEmail"
									value={formData.guardianEmail}
									onChange={handleChange}
									placeholder="guardian@example.com"
									disabled={saving || (!!editingId && !allowEmailEdit)}
									className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:bg-gray-50"
								/>
								{editingId && allowEmailEdit && (
									<p className="text-xs text-amber-600 mt-1">
										⚠️ Updates the database email. Deploy the Cloud Function to
										also update the login email.
									</p>
								)}
							</div>

							{!editingId && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Password
										</label>
										<input
											type="password"
											name="guardianPassword"
											value={formData.guardianPassword}
											onChange={handleChange}
											placeholder="Min. 6 characters"
											disabled={saving}
											className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Confirm Password
										</label>
										<input
											type="password"
											name="confirmPassword"
											value={formData.confirmPassword}
											onChange={handleChange}
											placeholder="Confirm password"
											disabled={saving}
											className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
										/>
									</div>
								</>
							)}
						</div>

						{/* RFID */}
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
							RFID Card
						</p>
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
							<input
								ref={rfidInputRef}
								type="text"
								name="rfidSerial"
								value={formData.rfidSerial}
								onChange={handleChange}
								disabled={saving}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										rfidInputRef.current?.blur();
									}
								}}
								className="w-full p-3 border-2 border-dashed border-gray-400 rounded-md text-center font-mono text-sm bg-white focus:outline-none focus:border-black disabled:opacity-50"
								placeholder="Tap card to scan..."
							/>
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							<button
								onClick={() => setShowForm(false)}
								disabled={saving}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={saving}
								className="flex-1 px-4 py-2 bg-red-950 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
								{saving
									? "Saving..."
									: editingId
										? "Update Student"
										: "Create Student"}
							</button>
						</div>
					</div>
				</div>
			)}
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

export { StudentPage as CreateUserPage };


