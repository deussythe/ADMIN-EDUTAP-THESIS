import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/configs/firebase";

interface UserRecord {
	name?: string;
	displayName?: string;
	role?: string;
	email?: string;
	phone?: string;
	serial?: string;
	status?: string;
	joined?: string;
	createdAt?: number;
	studentName?: string;
}

interface StudentRecord {
	id: string;
	name?: string;
	balance?: number;
	dailyLimit?: number;
	gradeLevel?: string;
	lrn?: string;
	rfidSerial?: string;
	status?: string;
	guardianName?: string;
	guardianEmail?: string;
	schoolEmail?: string;
	contactNumber?: string;
	photoUrl?: string;
	createdAt?: number;
}

async function findLinkedStudents(guardianId: string) {
	const linkedStudents = new Map<string, StudentRecord>();
	const byGuardianId = await getDocs(
		query(collection(db, "students"), where("guardianId", "==", guardianId)),
	);

	byGuardianId.docs.forEach((studentDoc) => {
		linkedStudents.set(studentDoc.id, {
			id: studentDoc.id,
			...studentDoc.data(),
		} as StudentRecord);
	});

	return Array.from(linkedStudents.values()).sort((a, b) => {
		const aCreatedAt = typeof a.createdAt === "number" ? a.createdAt : 0;
		const bCreatedAt = typeof b.createdAt === "number" ? b.createdAt : 0;
		if (aCreatedAt !== bCreatedAt) return aCreatedAt - bCreatedAt;
		return (a.name || "").localeCompare(b.name || "");
	});
}

export default function UserPanel() {
	const [user, setUser] = useState<UserRecord | null>(null);
	const [linkedStudents, setLinkedStudents] = useState<StudentRecord[]>([]);
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (!firebaseUser) {
				setLoading(false);				navigate("/", { replace: true });
				return;
			}

			try {
				const snap = await getDoc(doc(db, "users", firebaseUser.uid));
				if (!snap.exists()) {
					setLoading(false);
					navigate("/", { replace: true });
					return;
				}

				const data = snap.data() as Partial<UserRecord> & { role?: string };
				const normalizedRole = data.role?.toLowerCase();

				if (normalizedRole !== "staff" && normalizedRole !== "parent") {
					setLoading(false);
					navigate("/", { replace: true });
					return;
				}

				localStorage.setItem("role", normalizedRole);
				const normalizedUserEmail =
					typeof data.email === "string" && data.email.trim()
						? data.email.trim().toLowerCase()
						: firebaseUser.email?.trim().toLowerCase();
				localStorage.setItem(
					"username",
					data.displayName || data.name || firebaseUser.email || "User",
				);
				const profile: UserRecord = {
					name: data.name,
					displayName: data.displayName,
					role: normalizedRole,
					email: normalizedUserEmail ?? firebaseUser.email ?? data.email,
					phone: data.phone,
					serial: data.serial,
					status: data.status,
					joined: data.joined,
					createdAt: data.createdAt,
					studentName: data.studentName,
				};

				if (normalizedRole === "parent") {
					const studentRecords = await findLinkedStudents(firebaseUser.uid);
					setLinkedStudents(studentRecords);
					setSelectedStudentId((currentStudentId) =>
						currentStudentId &&
						studentRecords.some((studentRecord) => studentRecord.id === currentStudentId)
							? currentStudentId
							: (studentRecords[0]?.id ?? null),
					);
				} else {
					setLinkedStudents([]);
					setSelectedStudentId(null);
				}

				setUser(profile);
				setError(null);
			} catch (err: any) {
				console.error("UserPanel failed to load profile:", err);
				if (err?.code === "permission-denied") {
					setError(
						"Your parent account is signed in, but Firestore is blocking access to linked student records. Publish the latest Firestore rules and confirm each student is linked by guardianId.",
					);
				} else {
					setError("Failed to load your profile.");
				}
			} finally {
				setLoading(false);
			}
		});

		return () => unsubscribe();
	}, [navigate]);

	const handleLogout = async () => {
		await auth.signOut();
		localStorage.removeItem("username");
		localStorage.removeItem("role");
		navigate("/", { replace: true });
	};

	const displayName = user?.displayName || user?.name || user?.email || "User";
	const isParent = user?.role === "parent";
	const student =
		(selectedStudentId
			? linkedStudents.find((linkedStudent) => linkedStudent.id === selectedStudentId)
			: linkedStudents[0]) ??
		linkedStudents[0] ??
		null;
	const hasMultipleLinkedStudents = linkedStudents.length > 1;
	const walletBalance = Number(student?.balance ?? 0);
	const dailyLimit = typeof student?.dailyLimit === "number" ? student.dailyLimit : null;
	const studentName = student?.name || user?.studentName || "No linked student found";
	const studentInitial = studentName.trim().charAt(0).toUpperCase() || "S";
	const joinedLabel =
		user?.joined ||
		(typeof user?.createdAt === "number"
			? new Date(user.createdAt).toLocaleDateString("en-PH")
			: "-");

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
				<div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center">
					<h1 className="text-lg font-semibold text-gray-900">Profile Error</h1>
					<p className="mt-2 text-sm text-gray-500">{error}</p>
					<button
						onClick={() => navigate("/", { replace: true })}
						className="mt-4 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
						Back to Login
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-[#8B0000] text-white px-6 py-4 flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold">EDUTAP</h1>
					<p className="text-sm opacity-80">St. Clare College of Caloocan</p>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-sm">
						{user?.email} <span className="opacity-70 capitalize">({user?.role})</span>
					</span>
					<button
						onClick={handleLogout}
						className="px-4 py-2 border border-white rounded-lg text-sm hover:bg-white hover:text-[#8B0000] transition-colors">
						Logout
					</button>
				</div>
			</header>

			<main className="p-8 max-w-2xl mx-auto">
				<div className="space-y-6">
					{isParent && (
						<div className="rounded-lg border border-red-100 bg-gradient-to-r from-red-950 to-red-900 p-6 text-white">
							{hasMultipleLinkedStudents && (
								<div className="mb-5 flex justify-end">
									<label htmlFor="linked-student" className="sr-only">
										Student
									</label>
									<select
										id="linked-student"
										value={student?.id ?? ""}
										onChange={(event) => setSelectedStudentId(event.target.value)}
										className="max-w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none backdrop-blur-sm focus:ring-2 focus:ring-white/50">
										{linkedStudents.map((linkedStudent) => (
											<option
												key={linkedStudent.id}
												value={linkedStudent.id}
												className="text-gray-900">
												{linkedStudent.name || "Unnamed student"}
											</option>
										))}
									</select>
								</div>
							)}
							<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
								<div>
									<p className="text-sm uppercase tracking-[0.18em] text-red-100/80">
										Student Wallet
									</p>
									<h2 className="mt-3 text-4xl font-bold">
										PHP{" "}
										{walletBalance.toLocaleString("en-PH", {
											minimumFractionDigits: 2,
										})}
									</h2>
									{dailyLimit !== null && (
										<p className="mt-2 text-xs text-red-200">
											Daily limit: PHP{" "}
											{dailyLimit.toLocaleString("en-PH", {
												minimumFractionDigits: 2,
											})}
										</p>
									)}
								</div>

								<div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
									<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-xl font-bold text-white">
										{student?.photoUrl ? (
											<img
												src={student.photoUrl}
												alt={studentName}
												className="h-full w-full object-cover"
											/>
										) : (
											<span>{studentInitial}</span>
										)}
									</div>
									<div className="min-w-0">
										<p className="truncate text-lg font-semibold text-white">
											{studentName}
										</p>
										<p className="mt-1 text-sm text-red-100">
											LRN: {student?.lrn || "-"}
										</p>
										{student?.gradeLevel && (
											<p className="text-xs text-red-200">
												{student.gradeLevel}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
					{isParent && !student && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
							<p className="font-semibold">Student link still needs attention</p>
							<p className="mt-1">
								This parent account signed in successfully, but no linked student
								records could be loaded yet. Check that each matching{" "}
								<code>students</code> document has this parent&apos;s{" "}
								<code>guardianId</code>, and that the latest Firestore rules are
								published.
							</p>
						</div>
					)}

					<div className="bg-white rounded-lg border border-gray-200 p-8">
						<h2 className="text-2xl font-semibold mb-1">Welcome, {displayName}!</h2>
						<p className="text-gray-500 mb-6">
							{isParent
								? "Here's your parent profile."
								: "Here's your staff profile."}
						</p>

						<div className="space-y-4">
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Full Name</span>
								<span className="font-medium">{displayName}</span>
							</div>
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Email</span>
								<span className="font-medium">{user?.email}</span>
							</div>
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Role</span>
								<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
									{user?.role}
								</span>
							</div>
							{isParent && (
								<>
									<div className="flex justify-between border-b pb-3">
										<span className="text-gray-500">Student</span>
										<span className="font-medium">
											{student?.name || user?.studentName || "-"}
										</span>
									</div>
									<div className="flex justify-between border-b pb-3">
										<span className="text-gray-500">Grade Level</span>
										<span className="font-medium">
											{student?.gradeLevel || "-"}
										</span>
									</div>
									<div className="flex justify-between border-b pb-3">
										<span className="text-gray-500">LRN</span>
										<span className="font-medium">{student?.lrn || "-"}</span>
									</div>
									<div className="flex justify-between border-b pb-3">
										<span className="text-gray-500">RFID</span>
										<span className="font-mono text-blue-600">
											{student?.rfidSerial || "-"}
										</span>
									</div>
									<div className="flex justify-between border-b pb-3">
										<span className="text-gray-500">School Email</span>
										<span className="font-medium">
											{student?.schoolEmail || "-"}
										</span>
									</div>
								</>
							)}
							{user?.serial && (
								<div className="flex justify-between border-b pb-3">
									<span className="text-gray-500">Serial</span>
									<span className="font-mono text-blue-600">{user.serial}</span>
								</div>
							)}
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Phone</span>
								<span className="font-medium">
									{user?.phone || student?.contactNumber || "-"}
								</span>
							</div>
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Status</span>
								<span
									className={`px-3 py-1 rounded-full text-sm ${
										(user?.status || student?.status) === "Active"
											? "bg-green-100 text-green-700"
											: "bg-yellow-100 text-yellow-700"
									}`}>
									{user?.status || student?.status || "-"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-500">Joined</span>
								<span className="font-medium">{joinedLabel}</span>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
