import { Users, Phone, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/configs/firebase";
import { collection, onSnapshot, deleteDoc, setDoc, doc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/configs/firebase";
import { SystemDialog } from "@/components/ui/admin/system-dialog";
import { AdminPrimaryButton } from "@/components/ui/admin/admin-primary-button";

interface StaffMember {
	id: string;
	displayName: string;
	role: string;
	email: string;
	phone: string;
	joined: string;
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

export function StaffPage() {
	const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [formData, setFormData] = useState({
		displayName: "",
		email: "",
		phone: "",
		password: "",
	});
	const [dialog, setDialog] = useState<DialogState>({
		isOpen: false,
		title: "",
		message: "",
		variant: "info",
		confirmLabel: "OK",
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

	const filteredStaffMembers = staffMembers.filter(
		(staff) =>
			staff.displayName?.toLowerCase().includes(search.toLowerCase()) ||
			staff.email?.toLowerCase().includes(search.toLowerCase()) ||
			staff.phone?.toLowerCase().includes(search.toLowerCase()) ||
			staff.joined?.toLowerCase().includes(search.toLowerCase()),
	);

	// ─── Realtime listener ───────────────────────────────────────────────────
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
			if (!user) {
				setLoading(false);
				return;
			}

			// Query both "staff" and "Staff" to handle legacy data
			const q = query(collection(db, "users"), where("role", "in", ["staff", "Staff"]));

			const unsubscribeSnapshot = onSnapshot(
				q,
				(snapshot) => {
					const data: StaffMember[] = snapshot.docs.map((d) => ({
						id: d.id,
						...(d.data() as Omit<StaffMember, "id">),
					}));
					setStaffMembers(data);
					setError(null);
					setLoading(false);
				},
				(err) => {
					console.error("StaffPage query failed:", err.message);
					setError(err.message);
					setLoading(false);
				},
			);

			return () => unsubscribeSnapshot();
		});

		return () => unsubscribeAuth();
	}, []);

	// ─── Add Staff ───────────────────────────────────────────────────────────
	const handleAddStaff = async () => {
		if (!formData.displayName || !formData.email || !formData.phone || !formData.password) {
			showNotice("Incomplete Form", "Please fill in all fields.", "danger");
			return;
		}

		try {
			// 1. Use a secondary Firebase app so the admin session is NOT replaced
			//    We intentionally do NOT delete this app after use — deleting it
			//    mid-session can cause "app deleted" errors on subsequent calls.
			//    The secondary app is reused across invocations via getApps().
			const secondaryApp =
				getApps().find((app) => app.name === "secondary") ||
				initializeApp(firebaseConfig, "secondary");
			const secondaryAuth = getAuth(secondaryApp);

			// 2. Create Firebase Auth user with the secondary app
			const userCredential = await createUserWithEmailAndPassword(
				secondaryAuth,
				formData.email,
				formData.password,
			);
			const uid = userCredential.user.uid;

			// 3. Sign out from secondary auth to free up memory (optional but clean)
			await secondaryAuth.signOut();

			// 4. Write Firestore profile using the primary db (admin is still signed in)
			await setDoc(doc(db, "users", uid), {
				uid,
				displayName: formData.displayName,
				role: "staff", // always lowercase — consistent with rules
				email: formData.email.toLowerCase(),
				phone: formData.phone,
				status: "Active",
				joined: new Date().toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				}),
			});

			showNotice("Staff Added", "The staff member was added successfully.", "success");
			setShowModal(false);
			setFormData({ displayName: "", email: "", phone: "", password: "" });
		} catch (err: any) {
			if (err.code === "auth/email-already-in-use") {
				showNotice("Email Already Registered", "This email is already registered.", "danger");
			} else {
				showNotice("Add Staff Failed", "Failed to add staff: " + err.message, "danger");
			}
		}
	};

	// ─── Delete Staff ────────────────────────────────────────────────────────
	// NOTE: This only removes the Firestore document.
	// To fully delete the Firebase Auth account you need an Admin SDK Cloud Function.
	// The user will still be able to log in but will be redirected away (no Firestore doc).
	const handleDeleteStaff = async (id: string) => {
		showConfirm(
			"Remove Staff Member",
			"Are you sure you want to remove this staff member?",
			() => {
				void deleteDoc(doc(db, "users", id));
			},
			"Remove",
		);
	};

	// ─── Render ──────────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
				Loading staff...
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
				<p className="text-red-500 font-medium">Failed to load staff</p>
				<p className="text-sm text-gray-400 mt-1">{error}</p>
				<p className="text-sm text-gray-400 mt-2">
					Make sure your Firestore rules are published and your account has the{" "}
					<strong>admin</strong> role.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="bg-white rounded-lg border border-gray-200 p-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-semibold mb-2">Staff Management</h2>
						<p className="text-gray-600">
							Manage your staff members, roles, and permissions.
						</p>
					</div>
					<AdminPrimaryButton onClick={() => setShowModal(true)}>
						Add Staff
					</AdminPrimaryButton>
				</div>

				<div className="relative mb-6 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						placeholder="Search by name, email, phone..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
					/>
					{search && (
						<button
							onClick={() => setSearch("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Name
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Role
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Contact
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Joined
								</th>
								<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredStaffMembers.length === 0 ? (
								<tr>
									<td colSpan={5} className="text-center py-8 text-gray-400">
										{search
											? `No staff members found for "${search}".`
											: "No staff members found."}
									</td>
								</tr>
							) : (
								filteredStaffMembers.map((staff) => (
									<tr
										key={staff.id}
										className="border-b border-gray-100 hover:bg-gray-50">
										<td className="py-4 px-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
													<Users className="w-5 h-5 text-gray-600" />
												</div>
												<div>
													<p className="font-medium text-gray-900">
														{staff.displayName}
													</p>
													<p className="text-sm text-gray-500">
														{staff.email}
													</p>
												</div>
											</div>
										</td>
										<td className="py-4 px-4">
											<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
												Staff
											</span>
										</td>
										<td className="py-4 px-4">
											<div className="flex items-center gap-2 text-sm text-gray-600">
												<Phone className="w-4 h-4" />
												{staff.phone || "—"}
											</div>
										</td>
										<td className="py-4 px-4 text-sm text-gray-600">
											{staff.joined || "—"}
										</td>
										<td className="py-4 px-4">
											<button
												onClick={() => handleDeleteStaff(staff.id)}
												className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
												Remove
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Add Staff Modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
						<button
							onClick={() => setShowModal(false)}
							className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
							<X className="h-4 w-4" />
						</button>

						<div className="mb-6">
							<h2 className="text-xl font-semibold">Add New Staff Member</h2>
							<p className="text-sm text-gray-500">Fill in the details below</p>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1.5">
									Full Name
								</label>
								<input
									type="text"
									value={formData.displayName}
									onChange={(e) =>
										setFormData({ ...formData, displayName: e.target.value })
									}
									placeholder="Enter full name"
									className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">Role</label>
								<input
									type="text"
									value="Staff"
									disabled
									className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-gray-500 text-sm"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">Email</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									placeholder="email@example.com"
									className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">Password</label>
								<input
									type="password"
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									placeholder="Set initial password"
									className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1.5">
									Phone Number
								</label>
								<input
									type="tel"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									placeholder="+63 XXX XXX XXXX"
									className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
								/>
							</div>
						</div>

						<div className="mt-6 flex gap-3">
							<button
								onClick={() => setShowModal(false)}
								className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
								Cancel
							</button>
							<button
								onClick={handleAddStaff}
								className="flex-1 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
								Add Staff
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



