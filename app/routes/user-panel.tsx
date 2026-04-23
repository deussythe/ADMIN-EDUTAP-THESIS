import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

export default function UserPanel() {
	const [user, setUser] = useState<UserRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (!firebaseUser) {
				setLoading(false);
				navigate("/", { replace: true });
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
				localStorage.setItem(
					"username",
					data.displayName || data.name || firebaseUser.email || "User",
				);
				const profile: UserRecord = {
					name: data.name,
					displayName: data.displayName,
					role: normalizedRole,
					email: firebaseUser.email ?? data.email,
					phone: data.phone,
					serial: data.serial,
					status: data.status,
					joined: data.joined,
					createdAt: data.createdAt,
					studentName: data.studentName,
				};

				setUser(profile);
				setError(null);
			} catch (err: any) {
				console.error("UserPanel failed to load profile:", err);
				setError("Failed to load your profile.");
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
				<div className="bg-white rounded-lg border border-gray-200 p-8">
					<h2 className="text-2xl font-semibold mb-1">Welcome, {displayName}!</h2>
					<p className="text-gray-500 mb-6">
						{isParent ? "Here's your parent profile." : "Here's your staff profile."}
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
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Student</span>
								<span className="font-medium">{user?.studentName || "-"}</span>
							</div>
						)}
						{user?.serial && (
							<div className="flex justify-between border-b pb-3">
								<span className="text-gray-500">Serial</span>
								<span className="font-mono text-blue-600">{user.serial}</span>
							</div>
						)}
						<div className="flex justify-between border-b pb-3">
							<span className="text-gray-500">Phone</span>
							<span className="font-medium">{user?.phone || "-"}</span>
						</div>
						<div className="flex justify-between border-b pb-3">
							<span className="text-gray-500">Status</span>
							<span
								className={`px-3 py-1 rounded-full text-sm ${
									user?.status === "Active"
										? "bg-green-100 text-green-700"
										: "bg-yellow-100 text-yellow-700"
								}`}>
								{user?.status || "-"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-500">Joined</span>
							<span className="font-medium">{joinedLabel}</span>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
