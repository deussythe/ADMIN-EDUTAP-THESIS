import type React from "react";
import { useEffect, useState } from "react";
import { ShoppingCart, AlertCircle } from "lucide-react";
import {
	applyFavicon,
	defaultBrandingSettings,
	readBrandingCache,
	subscribeToBrandingSettings,
} from "@/configs/branding";

interface LoginFormProps {
	onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [schoolName, setSchoolName] = useState(defaultBrandingSettings.schoolName);
	const [canteenName, setCanteenName] = useState(defaultBrandingSettings.canteenName);
	const [themeColor, setThemeColor] = useState(defaultBrandingSettings.themeColor);
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
	const [loginBgType, setLoginBgType] = useState<"color" | "image">(
		defaultBrandingSettings.loginBgType,
	);
	const [loginBgColor, setLoginBgColor] = useState(defaultBrandingSettings.loginBgColor);
	const [loginBgUrl, setLoginBgUrl] = useState<string | null>(null);

	useEffect(() => {
		const cachedBranding = readBrandingCache();
		if (cachedBranding) {
			setSchoolName(cachedBranding.schoolName);
			setCanteenName(cachedBranding.canteenName);
			setThemeColor(cachedBranding.themeColor);
			setLogoUrl(cachedBranding.logoUrl);
			setFaviconUrl(cachedBranding.faviconUrl);
			setLoginBgType(cachedBranding.loginBgType);
			setLoginBgColor(cachedBranding.loginBgColor);
			setLoginBgUrl(cachedBranding.loginBgUrl);
			applyFavicon(cachedBranding.faviconUrl);
		}

		const unsubscribe = subscribeToBrandingSettings((branding) => {
			setSchoolName(branding.schoolName);
			setCanteenName(branding.canteenName);
			setThemeColor(branding.themeColor);
			setLogoUrl(branding.logoUrl);
			setFaviconUrl(branding.faviconUrl);
			setLoginBgType(branding.loginBgType);
			setLoginBgColor(branding.loginBgColor);
			setLoginBgUrl(branding.loginBgUrl);
			applyFavicon(branding.faviconUrl);
		});

		return unsubscribe;
	}, []);

	const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
		e.preventDefault();
		setError("");

		if (!email || !password) {
			setError("Please enter both email and password");
			return;
		}

		setIsLoading(true);
		try {
			await onLogin(email, password);
		} catch (err: any) {
			// Firebase error codes mapped to friendly messages
			const code = err.code;
			if (
				code === "auth/user-not-found" ||
				code === "auth/wrong-password" ||
				code === "auth/invalid-credential"
			) {
				setError("Invalid email or password.");
			} else if (code === "auth/invalid-email") {
				setError("Please enter a valid email address.");
			} else if (code === "auth/too-many-requests") {
				setError("Too many attempts. Please try again later.");
			} else {
				setError("Login failed. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const loginHeaderIcon = faviconUrl || logoUrl;

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={
				loginBgType === "image" && loginBgUrl
					? {
							backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.35), rgba(17, 24, 39, 0.55)), url(${loginBgUrl})`,
							backgroundPosition: "center",
							backgroundSize: "cover",
						}
					: {
							background: `linear-gradient(135deg, ${themeColor}, ${loginBgColor})`,
						}
			}>
			<div className="w-full max-w-md rounded-xl border border-red-700 bg-white shadow-2xl">
				<div
					className="space-y-3 rounded-t-xl p-6 text-center"
					style={{
						background: `linear-gradient(90deg, ${themeColor}, ${themeColor}dd)`,
					}}>
					<div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg">
						{loginHeaderIcon ? (
							<img
								src={loginHeaderIcon}
								alt="School logo"
								className="h-full w-full object-cover"
							/>
						) : (
							<ShoppingCart className="h-8 w-8" style={{ color: themeColor }} />
						)}
					</div>
					<h2 className="text-2xl font-bold text-white">{canteenName}</h2>
					<p className="text-sm text-red-100">{schoolName}</p>
				</div>

				<div className="p-6">
					<p className="text-center text-sm text-gray-600 mb-6">
						Sign in to access your dashboard
					</p>
					<div className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium text-gray-700">
								Email
							</label>
							<input
								id="email"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
								autoComplete="email"
								autoFocus
								disabled={isLoading}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								id="password"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
								autoComplete="current-password"
								disabled={isLoading}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100"
							/>
						</div>

						{error && (
							<div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
								<AlertCircle className="h-4 w-4" />
								<span>{error}</span>
							</div>
						)}

						<button
							type="button"
							onClick={handleSubmit}
							disabled={isLoading}
							className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-gray-400"
							style={{ backgroundColor: themeColor }}>
							{isLoading ? "Signing in..." : "Sign In"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
