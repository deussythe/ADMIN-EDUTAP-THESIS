"use client";

import { LoginForm } from "@/components/ui/login-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/configs/firebase";

export async function loader() {
	return null;
}

export default function LoginPage() {
	const handleLogin = async (email: string, password: string): Promise<void> => {
		// 1. Sign in with Firebase Auth
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		// 2. Fetch role from Firestore users collection
		const userDoc = await getDoc(doc(db, "users", user.uid));

		if (!userDoc.exists()) {
			throw { code: "auth/user-not-found" };
		}

		// 3. Normalize role
		const role = userDoc.data().role.toLowerCase() as string;

		// 4. Save to localStorage
		localStorage.setItem("username", user.displayName || user.email || "");
		localStorage.setItem("role", role);

		// 5. Redirect based on role
		if (role === "admin") {
			window.location.href = "/admin-panel";
		} else if (role === "staff") {
			window.location.href = "/user-panel";
		} else if (role === "parent") {
			window.location.href = "/parent-dashboard";
		} else {
			throw { code: "auth/invalid-credential" };
		}
	};

	return (
		<div>
			<LoginForm onLogin={handleLogin} />
		</div>
	);
}
