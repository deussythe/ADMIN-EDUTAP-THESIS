"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Users, Phone, Search, X, Edit2, Trash2, Loader, Link2, Settings } from "lucide-react";
import {
	collection,
	onSnapshot,
	addDoc,
	getDocs,
	updateDoc,
	doc,
	query,
	where,
} from "firebase/firestore";
import { db } from "@/configs/firebase";
import { archiveDocument } from "@/configs/adminUserService";
import { writeAccountAuditLog } from "@/configs/auditLogService";
import { AdminModalPortal } from "@/components/ui/admin/admin-modal-portal";
import { SystemDialog } from "@/components/ui/admin/system-dialog";
import { AdminPrimaryButton } from "@/components/ui/admin/admin-primary-button";

const CLOUDINARY_CLOUD_NAME = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET = "edutap_student_photos";
const MAX_STUDENTS_PER_PARENT = 5;
const PARENT_LINK_LIMIT_MESSAGE =
	"This parent already has the maximum of 5 linked students.";

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

interface ParentAccount {
	id: string;
	name?: string;
	displayName?: string;
	email?: string;
	phone?: string;
	joined?: string;
	role?: string;
	status?: string;
	createdAt?: number;
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
	parentAccountId: "",
	contactNumber: "",
	rfidSerial: "",
};

async function countLinkedStudentsForParent(parentUid: string) {
	const linkedSnapshot = await getDocs(
		query(collection(db, "students"), where("guardianId", "==", parentUid)),
	);
	return linkedSnapshot.size;
}

interface ParentSettingsFormData {
	name: string;
	email: string;
	phone: string;
	status: "Active" | "Inactive";
}

function getParentDisplayName(parent: ParentAccount) {
	return parent.name || parent.displayName || parent.email || "Parent";
}

function isParentRole(role?: string) {
	const normalizedRole = role?.trim().toLowerCase();
	return normalizedRole === "parent" || normalizedRole === "user";
}

export function StudentPage() {
	const [students, setStudents] = useState<Student[]>([]);
	const [parentAccounts, setParentAccounts] = useState<ParentAccount[]>([]);
	const [loading, setLoading] = useState(true);
	const [userView, setUserView] = useState<"students" | "parents">("students");
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [showLinkForm, setShowLinkForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingStudent, setEditingStudent] = useState<Student | null>(null);
	const [saving, setSaving] = useState(false);
	const [linkSaving, setLinkSaving] = useState(false);
	const [parentSaving, setParentSaving] = useState(false);
	const [showParentSettings, setShowParentSettings] = useState(false);
	const [editingParent, setEditingParent] = useState<ParentAccount | null>(null);
	const [linkStudentId, setLinkStudentId] = useState("");
	const [linkParentId, setLinkParentId] = useState("");
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [formData, setFormData] = useState({ ...EMPTY_FORM });
	const [allowEmailEdit, setAllowEmailEdit] = useState(false);
	const [parentFormData, setParentFormData] = useState<ParentSettingsFormData>({
		name: "",
		email: "",
		phone: "",
		status: "Active",
	});
	const [dialog, setDialog] = useState<DialogState>({
		isOpen: false,
		title: "",
		message: "",
		variant: "info",
		confirmLabel: "OK",
	});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const rfidInputRef = useRef<HTMLInputElement>(null);
	const closeFormModal = () => setShowForm(false);
	const closeLinkModal = () => setShowLinkForm(false);
	const closeParentSettingsModal = () => {
		setShowParentSettings(false);
		setEditingParent(null);
	};

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

	useEffect(() => {
		const q = query(collection(db, "users"));
		const unsub = onSnapshot(q, (snap) => {
			const parents = snap.docs
				.map((d) => ({ id: d.id, ...d.data() }) as ParentAccount)
				.filter((parent) => isParentRole(parent.role))
				.sort((a, b) => getParentDisplayName(a).localeCompare(getParentDisplayName(b)));
			setParentAccounts(parents);
		});
		return unsub;
	}, []);

	useEffect(() => {
		if (showForm && showLinkForm) {
			setShowLinkForm(false);
		}
	}, [showForm, showLinkForm]);

	useEffect(() => {
		if (userView === "parents") {
			setShowForm(false);
			setShowLinkForm(false);
		}
		if (userView === "students") {
			setShowParentSettings(false);
			setEditingParent(null);
		}
	}, [userView]);

	const filtered = students.filter(
		(s) =>
			s.name?.toLowerCase().includes(search.toLowerCase()) ||
			s.lrn?.toLowerCase().includes(search.toLowerCase()) ||
			s.gradeLevel?.toLowerCase().includes(search.toLowerCase()) ||
			s.guardianName?.toLowerCase().includes(search.toLowerCase()),
	);
	const linkableParentAccounts = parentAccounts.filter((parent) =>
		Boolean(parent.email?.trim()),
	);
	const parentAccountsMissingEmail = parentAccounts.filter(
		(parent) => !parent.email?.trim(),
	);
	const linkedStudentCountByParentId = useMemo(() => {
		return students.reduce<Record<string, number>>((counts, student) => {
			if (!student.guardianId) return counts;
			counts[student.guardianId] = (counts[student.guardianId] ?? 0) + 1;
			return counts;
		}, {});
	}, [students]);
	const selectedLinkParent = linkableParentAccounts.find(
		(parent) => parent.id === linkParentId,
	);
	const selectedLinkStudent = students.find((student) => student.id === linkStudentId);
	const selectedFormParent = linkableParentAccounts.find(
		(parent) => parent.id === formData.parentAccountId,
	);
	const selectedParentLinkedCount = linkParentId
		? (linkedStudentCountByParentId[linkParentId] ?? 0)
		: 0;
	const selectedFormParentLinkedCount = selectedFormParent
		? (linkedStudentCountByParentId[selectedFormParent.id] ?? 0)
		: 0;
	const selectedParentIsFull =
		Boolean(selectedLinkParent && selectedLinkStudent) &&
		selectedParentLinkedCount >= MAX_STUDENTS_PER_PARENT &&
		selectedLinkStudent?.guardianId !== selectedLinkParent?.id;
	const selectedFormParentIsFull =
		!editingId &&
		Boolean(selectedFormParent) &&
		selectedFormParentLinkedCount >= MAX_STUDENTS_PER_PARENT;
	const isStudentsView = userView === "students";
	const activeViewTitle = isStudentsView ? "Student Management" : "Parent Management";
	const activeViewDescription = isStudentsView
		? "Manage student profiles, guardian info, and RFID cards."
		: "View parent records and linked student counts.";

	// ─── Helpers ───────────────────────────────────────────────────────────
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleParentAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const parentAccountId = e.target.value;
		const parent = linkableParentAccounts.find((account) => account.id === parentAccountId);

		setFormData((current) => ({
			...current,
			parentAccountId,
			...(parent
				? {
						guardianName: getParentDisplayName(parent),
						guardianEmail: parent.email?.trim().toLowerCase() ?? "",
					}
				: {}),
		}));
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

	// ─── Open forms ────────────────────────────────────────────────────────
	const openAdd = () => {
		setShowLinkForm(false);
		setEditingId(null);
		setEditingStudent(null);
		setAllowEmailEdit(false);
		setFormData({ ...EMPTY_FORM });
		setPhotoFile(null);
		setPhotoPreview(null);
		setShowForm(true);
	};

	const openEdit = (student: Student) => {
		setShowLinkForm(false);
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
			parentAccountId: student.guardianId ?? "",
			contactNumber: student.contactNumber,
			rfidSerial: student.rfidSerial,
		});
		setPhotoFile(null);
		setPhotoPreview(student.photoUrl || null);
		setShowForm(true);
	};

	const openLinkStudent = (student?: Student) => {
		if (linkableParentAccounts.length === 0) {
			showNotice(
				"No Parent Accounts",
				"Create a parent account with a valid email first, then assign students to it.",
				"info",
			);
			return;
		}

		setShowForm(false);
		const existingParentId =
			student?.guardianId &&
			linkableParentAccounts.some((parent) => parent.id === student.guardianId)
				? student.guardianId
				: linkableParentAccounts[0].id;

		setLinkStudentId(student?.id ?? "");
		setLinkParentId(existingParentId);
		setShowLinkForm(true);
	};

	const openParentSettings = (parent: ParentAccount) => {
		setEditingParent(parent);
		setParentFormData({
			name: getParentDisplayName(parent),
			email: parent.email ?? "",
			phone: parent.phone ?? "",
			status: parent.status === "Inactive" ? "Inactive" : "Active",
		});
		setShowParentSettings(true);
	};

	// ─── Delete ────────────────────────────────────────────────────────────
	const handleDelete = async (id: string) => {
		const studentToDelete = students.find((student) => student.id === id);
		showConfirm(
			"Archive Student",
			"Are you sure you want to archive this student?",
			() => {
				void (async () => {
					try {
						await archiveDocument("students", id);
						if (studentToDelete) {
							await writeAccountAuditLog({
								action: "archived",
								targetType: "student",
								targetId: id,
								targetName: studentToDelete.name,
								details: `Student account for ${studentToDelete.name} was archived.`,
							});
						}
						showNotice(
							"Student Archived",
							"Student was archived and can be restored from System Archive.",
							"success",
						);
					} catch (err: any) {
						showNotice("Archive Failed", "Error: " + err.message, "danger");
					}
				})();
			},
			"Archive",
		);
	};

	// ─── Submit (add or edit) ──────────────────────────────────────────────
	const handleSaveStudentLink = async () => {
		if (!selectedLinkStudent || !selectedLinkParent) {
			showNotice("Missing Selection", "Select a student and parent account.", "danger");
			return;
		}

		const parentEmail = selectedLinkParent.email?.trim().toLowerCase();
		if (!parentEmail) {
			showNotice("Missing Parent Email", "The selected parent account has no email.", "danger");
			return;
		}

		setLinkSaving(true);
		try {
			const linkedStudentCount = await countLinkedStudentsForParent(selectedLinkParent.id);
			const alreadyLinkedToParent = selectedLinkStudent.guardianId === selectedLinkParent.id;

			if (linkedStudentCount >= MAX_STUDENTS_PER_PARENT && !alreadyLinkedToParent) {
				showNotice("Link Limit Reached", PARENT_LINK_LIMIT_MESSAGE, "danger");
				return;
			}

			await updateDoc(doc(db, "students", selectedLinkStudent.id), {
				guardianId: selectedLinkParent.id,
				guardianEmail: parentEmail,
				guardianName: getParentDisplayName(selectedLinkParent),
			});

			await writeAccountAuditLog({
				action: "updated",
				targetType: "student",
				targetId: selectedLinkStudent.id,
				targetName: selectedLinkStudent.name,
				details: `Student assigned to parent account ${parentEmail}.`,
			});

			setShowLinkForm(false);
			showNotice(
				"Student Link Saved",
				"Student is now assigned to the selected parent account.",
				"success",
			);
		} catch (err: any) {
			showNotice("Save Link Failed", "Error: " + err.message, "danger");
		} finally {
			setLinkSaving(false);
		}
	};

	const handleSubmit = async () => {
		const parentForNewStudent = !editingId ? selectedFormParent : null;
		const guardianName = parentForNewStudent
			? getParentDisplayName(parentForNewStudent)
			: formData.guardianName.trim();
		const normalizedGuardianEmail = (
			parentForNewStudent?.email ?? formData.guardianEmail
		)
			.trim()
			.toLowerCase();

		if (
			!formData.name ||
			!formData.lrn ||
			!formData.gradeLevel ||
			!guardianName ||
			!normalizedGuardianEmail ||
			!formData.contactNumber ||
			!formData.rfidSerial
		) {
			showNotice("Incomplete Form", "Please fill in all required fields.", "danger");
			return;
		}

		setSaving(true);
		try {
			if (parentForNewStudent) {
				const linkedStudentCount = await countLinkedStudentsForParent(parentForNewStudent.id);
				if (linkedStudentCount >= MAX_STUDENTS_PER_PARENT) {
					showNotice("Link Limit Reached", PARENT_LINK_LIMIT_MESSAGE, "danger");
					return;
				}
			}

			let photoUrl = photoPreview || "";
			if (photoFile) photoUrl = await uploadPhoto(photoFile);

			// ── EDIT ──────────────────────────────────────────────────────
			if (editingId && editingStudent) {
				const newEmail = normalizedGuardianEmail;
				const oldEmail = editingStudent.guardianEmail?.toLowerCase();
				const emailChanged = allowEmailEdit && newEmail !== oldEmail;

				await updateDoc(doc(db, "students", editingId), {
					name: formData.name,
					gradeLevel: formData.gradeLevel,
					lrn: formData.lrn,
					schoolEmail: formData.schoolEmail,
					guardianName,
					guardianEmail: newEmail,
					contactNumber: formData.contactNumber,
					rfidSerial: formData.rfidSerial,
					...(photoFile ? { photoUrl } : {}),
				});

				const changeSummary = [
					editingStudent.name !== formData.name
						? `student name: "${editingStudent.name}" -> "${formData.name}"`
						: null,
					editingStudent.guardianName !== guardianName
						? `guardian: "${editingStudent.guardianName}" -> "${guardianName}"`
						: null,
					editingStudent.contactNumber !== formData.contactNumber
						? `contact: "${editingStudent.contactNumber}" -> "${formData.contactNumber}"`
						: null,
					editingStudent.rfidSerial !== formData.rfidSerial
						? `RFID: "${editingStudent.rfidSerial}" -> "${formData.rfidSerial}"`
						: null,
					emailChanged
						? `guardian email: "${oldEmail ?? "-"}" -> "${newEmail}"`
						: null,
				]
					.filter(Boolean)
					.join(", ");

				await writeAccountAuditLog({
					action: "updated",
					targetType: "student",
					targetId: editingId,
					targetName: formData.name,
					details: changeSummary || "Student account details were updated.",
				});

				showNotice("Student Updated", "Student updated successfully!", "success");

				// ── ADD ───────────────────────────────────────────────────────
			} else {
				// Write student doc
				const studentRef = await addDoc(collection(db, "students"), {
					name: formData.name,
					gradeLevel: formData.gradeLevel,
					lrn: formData.lrn,
					schoolEmail: formData.schoolEmail,
					guardianName,
					guardianEmail: normalizedGuardianEmail,
					contactNumber: formData.contactNumber,
					rfidSerial: formData.rfidSerial,
					photoUrl,
					balance: 0,
					...(parentForNewStudent ? { guardianId: parentForNewStudent.id } : {}),
					status: "Active",
					createdAt: Date.now(),
				});

				await writeAccountAuditLog({
					action: "created",
					targetType: "student",
					targetId: studentRef.id,
					targetName: formData.name,
					details: parentForNewStudent
						? `Student record created and assigned to parent account ${normalizedGuardianEmail}.`
						: "Student record created without a linked parent account.",
				});

				showNotice(
					parentForNewStudent ? "Student Added and Linked" : "Student Added",
					parentForNewStudent
						? "Student record created and assigned to the selected parent."
						: "Student record created successfully.",
					"success",
				);
			}

			setShowForm(false);
		} catch (err: any) {
			showNotice("Save Failed", "Error: " + err.message, "danger");
		} finally {
			setSaving(false);
		}
	};

	const handleSaveParentSettings = async () => {
		if (!editingParent) return;

		const trimmedName = parentFormData.name.trim();
		if (!trimmedName) {
			showNotice("Missing Name", "Parent name is required.", "danger");
			return;
		}

		setParentSaving(true);
		try {
			await updateDoc(doc(db, "users", editingParent.id), {
				displayName: trimmedName,
				name: trimmedName,
				phone: parentFormData.phone.trim(),
				status: parentFormData.status,
			});

			await writeAccountAuditLog({
				action: "updated",
				targetType: "user",
				targetId: editingParent.id,
				targetName: trimmedName,
				details: "Parent account settings were updated from User Management.",
			});

			closeParentSettingsModal();
			showNotice("Parent Updated", "Parent settings saved successfully.", "success");
		} catch (err: any) {
			showNotice("Save Failed", "Error: " + err.message, "danger");
		} finally {
			setParentSaving(false);
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
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-2xl font-semibold mb-1">{activeViewTitle}</h2>
						<p className="text-gray-600">{activeViewDescription}</p>
					</div>
					<div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
						<button
							type="button"
							onClick={() => setUserView("students")}
							className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
								userView === "students"
									? "bg-red-950 text-white shadow-sm"
									: "text-gray-600 hover:text-gray-800"
							}`}>
							Students
						</button>
						<button
							type="button"
							onClick={() => setUserView("parents")}
							className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
								userView === "parents"
									? "bg-red-950 text-white shadow-sm"
									: "text-gray-600 hover:text-gray-800"
							}`}>
							Parents
						</button>
					</div>
				</div>

				{userView === "parents" && (
					<section className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
					<div className="mb-4 flex justify-end">
						<div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
							{parentAccounts.length} total
						</div>
					</div>

					{parentAccounts.length === 0 ? (
						<div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
							No parent accounts found yet.
						</div>
					) : (
						<div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200 bg-gray-50">
										<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
											Parent
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
											Contact
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
											Linked Students
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
											Status
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{parentAccounts.map((parent) => {
										const linkedCount = linkedStudentCountByParentId[parent.id] ?? 0;
										const isAtLimit = linkedCount >= MAX_STUDENTS_PER_PARENT;
										return (
											<tr key={parent.id} className="border-b border-gray-100 last:border-b-0">
												<td className="px-4 py-3">
													<p className="text-sm font-medium text-gray-900">
														{getParentDisplayName(parent)}
													</p>
													<p className="text-xs text-gray-500">{parent.role || "parent"}</p>
												</td>
												<td className="px-4 py-3">
													<p className="text-sm text-gray-700">{parent.email || "-"}</p>
													<p className="text-xs text-gray-500">{parent.phone || "-"}</p>
												</td>
												<td className="px-4 py-3">
													<span
														className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
															isAtLimit
																? "bg-red-100 text-red-700"
																: "bg-emerald-100 text-emerald-700"
														}`}>
														{linkedCount}/{MAX_STUDENTS_PER_PARENT}
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-gray-700">
													{parent.status || "Active"}
												</td>
												<td className="px-4 py-3">
													<button
														type="button"
														onClick={() => openParentSettings(parent)}
														className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50">
														<Settings className="h-3.5 w-3.5" />
														Settings
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{parentAccountsMissingEmail.length > 0 && (
						<p className="mt-3 text-xs font-medium text-amber-700">
							{parentAccountsMissingEmail.length} parent account(s) are missing an email and
							cannot be selected for linking.
						</p>
					)}
					</section>
				)}

				{userView === "students" && (
					<>
					<div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
					<p className="text-sm text-gray-500">
						Showing {filtered.length} student record{filtered.length === 1 ? "" : "s"}.
					</p>
					<div className="flex flex-col gap-2 sm:flex-row">
						<button
							type="button"
							onClick={() => openLinkStudent()}
							className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md">
							<Link2 className="h-4 w-4 shrink-0" />
							<span>Link Existing Student</span>
						</button>
						<AdminPrimaryButton onClick={openAdd}>Add Student</AdminPrimaryButton>
					</div>
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
														<span className="font-mono">
															{student.lrn}
														</span>
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
													onClick={() => openLinkStudent(student)}
													className="flex items-center gap-1 px-3 py-1 text-sm text-red-800 hover:bg-red-50 rounded-lg transition-colors">
													<Link2 className="w-3.5 h-3.5" /> Assign to Parent
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
					</>
				)}
			</div>

			{/* Link Existing Student Modal */}
			{showLinkForm && (
				<AdminModalPortal>
					<div className="admin-modal-backdrop">
						<div className="admin-modal-panel relative max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h3 className="text-xl font-semibold">Link Existing Student</h3>
								<p className="text-sm text-gray-500">
									Assign a student record to a parent account.
								</p>
							</div>
							<button
								type="button"
								onClick={closeLinkModal}
								disabled={linkSaving}
								className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="space-y-5">
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Parent Account
								</label>
								<select
									value={linkParentId}
									onChange={(event) => setLinkParentId(event.target.value)}
									disabled={linkSaving}
									className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50">
									{linkableParentAccounts.map((parent) => (
										<option key={parent.id} value={parent.id}>
											{getParentDisplayName(parent)} - {parent.email}
										</option>
									))}
								</select>
								<p
									className={`mt-2 text-xs font-medium ${
										selectedParentIsFull ? "text-red-700" : "text-gray-500"
									}`}>
									{selectedParentIsFull
										? PARENT_LINK_LIMIT_MESSAGE
										: `${selectedParentLinkedCount}/${MAX_STUDENTS_PER_PARENT} students linked`}
								</p>
							</div>

							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Student
								</label>
								<select
									value={linkStudentId}
									onChange={(event) => setLinkStudentId(event.target.value)}
									disabled={linkSaving}
									className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50">
									<option value="">Select student</option>
									{students.map((student) => (
										<option key={student.id} value={student.id}>
											{student.name} - LRN {student.lrn}
										</option>
									))}
								</select>
								{selectedLinkStudent?.guardianName && (
									<p className="mt-2 text-xs text-gray-500">
										Current parent: {selectedLinkStudent.guardianName}
									</p>
								)}
							</div>
						</div>

						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={closeLinkModal}
								disabled={linkSaving}
								className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSaveStudentLink}
								disabled={linkSaving || !linkParentId || !linkStudentId}
								className="flex-1 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
								{linkSaving ? "Saving..." : "Save Student Link"}
							</button>
						</div>
					</div>
					</div>
				</AdminModalPortal>
			)}

			{/* Add / Edit Modal */}
			{showForm && (
				<AdminModalPortal>
					<div className="admin-modal-backdrop">
						<div className="admin-modal-panel relative max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
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
								onClick={closeFormModal}
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
										disabled={
											saving ||
											(!editingId &&
												Boolean(selectedFormParent) &&
												f.name === "guardianName")
										}
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
						{!editingId && (
							<div className="mb-5 rounded-lg border border-red-100 bg-red-50/40 p-4">
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Parent Account (Optional)
								</label>
								<select
									name="parentAccountId"
									value={formData.parentAccountId}
									onChange={handleParentAccountChange}
									disabled={saving}
									className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50">
									<option value="">No parent selected</option>
									{linkableParentAccounts.map((parent) => (
										<option key={parent.id} value={parent.id}>
											{getParentDisplayName(parent)} - {parent.email}
										</option>
									))}
								</select>
								<p
									className={`mt-2 text-xs font-medium ${
										selectedFormParentIsFull ? "text-red-700" : "text-gray-500"
									}`}>
									{selectedFormParentIsFull
										? PARENT_LINK_LIMIT_MESSAGE
										: selectedFormParent
											? `${selectedFormParentLinkedCount}/${MAX_STUDENTS_PER_PARENT} students linked to this parent`
											: "Leave blank to add a student-only record. Choose a parent to link now."}
								</p>
							</div>
						)}
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
									disabled={
										saving ||
										(!editingId && Boolean(selectedFormParent)) ||
										(!!editingId && !allowEmailEdit)
									}
									className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:bg-gray-50"
								/>
								{!editingId && selectedFormParent && (
									<p className="text-xs text-gray-500 mt-1">
										Guardian details will be saved from the selected parent
										account.
									</p>
								)}
								{editingId && allowEmailEdit && (
									<p className="text-xs text-amber-600 mt-1">
										⚠️ Updates the database email. Deploy the Cloud Function to
										also update the login email.
									</p>
								)}
							</div>

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
								onClick={closeFormModal}
								disabled={saving}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={saving || selectedFormParentIsFull}
								className="flex-1 px-4 py-2 bg-red-950 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
								{saving
									? "Saving..."
									: editingId
										? "Update Student"
									: "Add Student"}
							</button>
						</div>
					</div>
					</div>
				</AdminModalPortal>
			)}

			{/* Parent Settings Modal */}
			{showParentSettings && editingParent && (
				<AdminModalPortal>
					<div className="admin-modal-backdrop">
						<div className="admin-modal-panel relative max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
							<div className="mb-6 flex items-center justify-between">
								<div>
									<h3 className="text-xl font-semibold">Parent Settings</h3>
									<p className="text-sm text-gray-500">
										Manage details for this parent account only.
									</p>
								</div>
								<button
									type="button"
									onClick={closeParentSettingsModal}
									disabled={parentSaving}
									className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
									<X className="h-5 w-5" />
								</button>
							</div>

							<div className="space-y-4">
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">
										Full Name
									</label>
									<input
										type="text"
										value={parentFormData.name}
										onChange={(event) =>
											setParentFormData((current) => ({
												...current,
												name: event.target.value,
											}))
										}
										disabled={parentSaving}
										className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
									/>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">
										Email
									</label>
									<input
										type="text"
										value={parentFormData.email}
										readOnly
										className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm text-gray-500"
									/>
									<p className="mt-1 text-xs text-gray-500">
										Email is read-only here to avoid auth mismatch.
									</p>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">
										Contact Number
									</label>
									<input
										type="text"
										value={parentFormData.phone}
										onChange={(event) =>
											setParentFormData((current) => ({
												...current,
												phone: event.target.value,
											}))
										}
										disabled={parentSaving}
										className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
									/>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">
										Status
									</label>
									<select
										value={parentFormData.status}
										onChange={(event) =>
											setParentFormData((current) => ({
												...current,
												status: event.target.value as "Active" | "Inactive",
											}))
										}
										disabled={parentSaving}
										className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50">
										<option value="Active">Active</option>
										<option value="Inactive">Inactive</option>
									</select>
								</div>
							</div>

							<div className="mt-6 flex gap-3">
								<button
									type="button"
									onClick={closeParentSettingsModal}
									disabled={parentSaving}
									className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSaveParentSettings}
									disabled={parentSaving}
									className="flex-1 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
									{parentSaving ? "Saving..." : "Save Parent Settings"}
								</button>
							</div>
						</div>
					</div>
				</AdminModalPortal>
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
