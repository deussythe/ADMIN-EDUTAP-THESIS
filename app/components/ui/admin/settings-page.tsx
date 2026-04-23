"use client";

import { useEffect, useRef, useState } from "react";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import {
	readBrandingCache,
	subscribeToBrandingSettings,
	writeBrandingCache,
} from "@/configs/branding";
import { db } from "@/configs/firebase";

interface Category {
	id: string;
	name: string;
}

interface BrandingState {
	schoolName: string;
	canteenName: string;
	themeColor: string;
	logoUrl: string | null;
	faviconUrl: string | null;
	loginBgType: "color" | "image";
	loginBgColor: string;
	loginBgUrl: string | null;
}

interface PendingFiles {
	logoFile: File | null;
	faviconFile: File | null;
	loginBgFile: File | null;
}

type BrandingTab = "staff" | "student" | "admin";

const DEFAULT_BRANDING: BrandingState = {
	schoolName: "",
	canteenName: "",
	themeColor: "#7f1d1d",
	logoUrl: null,
	faviconUrl: null,
	loginBgType: "color",
	loginBgColor: "#ffffff",
	loginBgUrl: null,
};

const CLOUDINARY_CLOUD_NAME = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET = "branding_edutap";

function getBrandingIconUrl(branding: BrandingState) {
	return branding.faviconUrl || branding.logoUrl;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function SectionCard({
	eyebrow,
	title,
	description,
	children,
	className,
}: {
	eyebrow: string;
	title: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			className={`overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md ${className ?? ""}`}>
			<div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5 sm:px-7">
				<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-900/70">
					{eyebrow}
				</p>
				<h3 className="mt-2 text-xl font-semibold text-gray-900">{title}</h3>
				{description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
			</div>
			<div className="px-6 py-6 sm:px-7">{children}</div>
		</section>
	);
}

function SaveButton({
	saving,
	saved,
	onClick,
	label = "Save Changes",
}: {
	saving: boolean;
	saved: boolean;
	onClick: () => void;
	label?: string;
}) {
	return (
		<button
			onClick={onClick}
			disabled={saving}
			className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-950 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
			{saving ? (
				<>
					<span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
					Saving...
				</>
			) : saved ? (
				"Saved!"
			) : (
				label
			)}
		</button>
	);
}

function FieldLabel({ label, helper }: { label: string; helper?: string }) {
	return (
		<div className="mb-2">
			<label className="block text-sm font-medium text-gray-800">{label}</label>
			{helper && <p className="mt-0.5 text-xs text-gray-500">{helper}</p>}
		</div>
	);
}

function AssetTile({
	label,
	helper,
	preview,
	onClick,
	shape = "rectangle",
}: {
	label: string;
	helper: string;
	preview: string | null;
	onClick: () => void;
	shape?: "rectangle" | "square" | "wide";
}) {
	const tileHeight = shape === "wide" ? "h-28" : shape === "square" ? "h-28" : "h-32";
	const imageClass =
		shape === "square"
			? "h-16 w-16 object-contain"
			: shape === "wide"
				? "h-full w-full object-cover"
				: "max-h-20 max-w-full object-contain";

	return (
		<div className="space-y-2">
			<FieldLabel label={label} helper={helper} />
			<button
				type="button"
				onClick={onClick}
				className={`group flex ${tileHeight} w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-900/40 hover:bg-red-50/40 hover:shadow-sm`}>
				{preview ? (
					<img
						src={preview}
						alt={label}
						className={`${imageClass} transition-transform duration-500 group-hover:scale-[1.03]`}
					/>
				) : (
					<div className="text-center transition-transform duration-300 group-hover:-translate-y-0.5">
						<p className="text-sm font-medium text-gray-600">Upload</p>
						<p className="mt-1 text-xs text-gray-400">Click to choose a file</p>
					</div>
				)}
			</button>
		</div>
	);
}

// ── Branding Panel ─────────────────────────────────────────────────────────
function BrandingPanel({
	branding,
	onChange,
	onSave,
	saving,
	saved,
	error,
	saveLabel,
	headerPreview,
}: {
	branding: BrandingState;
	onChange: (next: Partial<BrandingState>) => void;
	onSave: (files: PendingFiles) => Promise<void>;
	saving: boolean;
	saved: boolean;
	error: string | null;
	saveLabel: string;
	headerPreview: React.ReactNode;
}) {
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [faviconFile, setFaviconFile] = useState<File | null>(null);
	const [loginBgFile, setLoginBgFile] = useState<File | null>(null);
	const brandingIconUrl = getBrandingIconUrl(branding);

	const logoRef = useRef<HTMLInputElement>(null);
	const faviconRef = useRef<HTMLInputElement>(null);
	const loginBgRef = useRef<HTMLInputElement>(null);
	const objectUrlRef = useRef<Partial<Record<"logoUrl" | "faviconUrl" | "loginBgUrl", string>>>(
		{},
	);

	useEffect(() => {
		return () => {
			Object.values(objectUrlRef.current).forEach((url) => {
				if (url) URL.revokeObjectURL(url);
			});
		};
	}, []);

	const handleFileChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		field: "logoUrl" | "faviconUrl" | "loginBgUrl",
		setFile: (f: File | null) => void,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setFile(file);
		const previousObjectUrl = objectUrlRef.current[field];
		if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
		const objectUrl = URL.createObjectURL(file);
		objectUrlRef.current[field] = objectUrl;
		onChange({ [field]: objectUrl }); // blob preview only — real upload happens on save
	};

	const clearPendingFiles = () => {
		setLogoFile(null);
		setFaviconFile(null);
		setLoginBgFile(null);
		if (logoRef.current) logoRef.current.value = "";
		if (faviconRef.current) faviconRef.current.value = "";
		if (loginBgRef.current) loginBgRef.current.value = "";
	};

	return (
		<div className="settings-tab-panel space-y-5">
			{/* Header preview */}
			<div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
				{headerPreview}
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
				<div className="space-y-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<FieldLabel
								label="School name"
								helper="Shown in the header subtitle."
							/>
							<input
								type="text"
								value={branding.schoolName}
								onChange={(e) => onChange({ schoolName: e.target.value })}
								placeholder="e.g. St. Clare College of Caloocan"
								className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
							/>
						</div>
						<div>
							<FieldLabel
								label="Canteen name"
								helper="Short recognizable name for the interface."
							/>
							<input
								type="text"
								value={branding.canteenName}
								onChange={(e) => onChange({ canteenName: e.target.value })}
								placeholder="e.g. EDUTAP"
								className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
							/>
						</div>
					</div>

					<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
						<FieldLabel
							label="Theme color"
							helper="Primary accent for buttons and active UI areas."
						/>
						<div className="grid gap-4 sm:grid-cols-[auto_132px_1fr]">
							<input
								type="color"
								value={branding.themeColor}
								onChange={(e) => onChange({ themeColor: e.target.value })}
								className="h-12 w-16 rounded-xl border border-gray-300 bg-white p-1"
							/>
							<input
								type="text"
								value={branding.themeColor}
								onChange={(e) => onChange({ themeColor: e.target.value })}
								className="rounded-xl border border-gray-300 bg-white px-3 py-3 font-mono text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
							/>
							<div
								className="rounded-xl border border-gray-200"
								style={{ backgroundColor: branding.themeColor }}
							/>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<AssetTile
							label="Logo"
							helper="Replaces the default EDUTAP mark."
							preview={branding.logoUrl}
							onClick={() => logoRef.current?.click()}
						/>
						<AssetTile
							label="Favicon"
							helper="Shown in the browser tab."
							preview={branding.faviconUrl}
							onClick={() => faviconRef.current?.click()}
							shape="square"
						/>
						<div className="space-y-2 md:col-span-2 xl:col-span-1">
							<FieldLabel
								label="Login background"
								helper="Color wash or hero image behind the login form."
							/>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => onChange({ loginBgType: "color" })}
									className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
										branding.loginBgType === "color"
											? "bg-red-950 text-white"
											: "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
									}`}>
									Color
								</button>
								<button
									type="button"
									onClick={() => onChange({ loginBgType: "image" })}
									className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
										branding.loginBgType === "image"
											? "bg-red-950 text-white"
											: "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
									}`}>
									Image
								</button>
							</div>

							{branding.loginBgType === "color" ? (
								<div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
									<div className="flex items-center gap-3">
										<input
											type="color"
											value={branding.loginBgColor}
											onChange={(e) =>
												onChange({ loginBgColor: e.target.value })
											}
											className="h-11 w-14 rounded-xl border border-gray-300 bg-white p-1"
										/>
										<input
											type="text"
											value={branding.loginBgColor}
											onChange={(e) =>
												onChange({ loginBgColor: e.target.value })
											}
											className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
										/>
									</div>
									<div
										className="mt-3 h-16 rounded-xl border border-gray-200"
										style={{ backgroundColor: branding.loginBgColor }}
									/>
								</div>
							) : (
								<AssetTile
									label="Background image"
									helper="Used behind the login form."
									preview={branding.loginBgUrl}
									onClick={() => loginBgRef.current?.click()}
									shape="wide"
								/>
							)}
						</div>
					</div>

					<input
						ref={logoRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(e) => handleFileChange(e, "logoUrl", setLogoFile)}
					/>
					<input
						ref={faviconRef}
						type="file"
						accept="image/x-icon,image/png,image/svg+xml"
						className="hidden"
						onChange={(e) => handleFileChange(e, "faviconUrl", setFaviconFile)}
					/>
					<input
						ref={loginBgRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(e) => handleFileChange(e, "loginBgUrl", setLoginBgFile)}
					/>
				</div>

				{/* Live preview + save */}
				<div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
						Live preview
					</p>
					<div className="mt-2 flex items-center justify-between gap-3">
						<p className="text-sm text-gray-500">Login card and hero treatment</p>
						<span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
							Responsive
						</span>
					</div>
					<div className="mt-4 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm sm:rounded-[28px]">
						<div
							className="relative h-32 border-b border-gray-200 sm:h-40 lg:h-44"
							style={
								branding.loginBgType === "image" && branding.loginBgUrl
									? {
											backgroundImage: `url(${branding.loginBgUrl})`,
											backgroundPosition: "center",
											backgroundSize: "cover",
										}
									: { backgroundColor: branding.loginBgColor }
							}>
							<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-white/70" />
						</div>
						<div className="-mt-8 px-3 pb-3 sm:-mt-12 sm:px-4 sm:pb-4 lg:-mt-16 lg:px-5 lg:pb-5">
							<div className="rounded-[24px] border border-gray-200 bg-white px-3.5 py-4 shadow-lg sm:rounded-3xl sm:px-4 sm:py-4 lg:px-5 lg:py-5">
								<div className="flex items-start gap-3 sm:items-center">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 sm:h-12 sm:w-12">
										{brandingIconUrl ? (
											<img
												src={brandingIconUrl}
												alt="Logo preview"
												className="h-full w-full object-cover"
											/>
										) : (
											<span
												className="h-7 w-7 rounded-lg"
												style={{ backgroundColor: branding.themeColor }}
											/>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-gray-900">
											{branding.canteenName || "School Canteen"}
										</p>
										<p className="line-clamp-2 text-xs leading-5 text-gray-500">
											{branding.schoolName || "Your school name"}
										</p>
									</div>
									<span className="hidden rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 sm:inline-flex">
										Portal
									</span>
								</div>
								<div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
									<div className="h-9 rounded-xl border border-gray-200 bg-gray-50 sm:h-10" />
									<div className="h-9 rounded-xl border border-gray-200 bg-gray-50 sm:h-10" />
									<div
										className="h-9 rounded-xl sm:h-10"
										style={{ backgroundColor: branding.themeColor }}
									/>
								</div>
								<div className="mt-4 flex flex-wrap gap-2">
									<span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500">
										Sign in
									</span>
									<span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500">
										Forgot password
									</span>
								</div>
							</div>
						</div>
					</div>

					{error && (
						<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="mt-5 flex justify-end">
						<SaveButton
							saving={saving}
							saved={saved}
							onClick={() => {
								void onSave({ logoFile, faviconFile, loginBgFile }).then(
									clearPendingFiles,
								);
							}}
							label={saveLabel}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// ── Header previews ────────────────────────────────────────────────────────
function StaffHeaderPreview({ branding }: { branding: BrandingState }) {
	const brandingIconUrl = getBrandingIconUrl(branding);

	return (
		<div
			className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
			style={{
				background: `linear-gradient(to right, ${branding.themeColor}dd, ${branding.themeColor})`,
			}}>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">
					{brandingIconUrl ? (
						<img
							src={brandingIconUrl}
							alt="Logo"
							className="h-full w-full object-cover"
						/>
					) : (
						<span className="text-xs text-white">★</span>
					)}
				</div>
				<div>
					<span className="text-sm font-semibold text-white">
						{branding.canteenName || "EDUTAP"}
					</span>
					<p className="text-xs text-white/70">{branding.schoolName || "School name"}</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 sm:justify-end">
				{["POS", "History", "Calendar", "Products"].map((label, i) => (
					<span
						key={label}
						className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${
							i === 0
								? "bg-white text-red-900"
								: "border border-white/20 bg-white/10 text-white"
						}`}>
						{label}
					</span>
				))}
				<span className="rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-semibold text-red-900">
					Logout
				</span>
			</div>
		</div>
	);
}

function StudentHeaderPreview({ branding }: { branding: BrandingState }) {
	const brandingIconUrl = getBrandingIconUrl(branding);

	return (
		<div
			className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
			style={{
				background: `linear-gradient(to right, ${branding.themeColor}dd, ${branding.themeColor})`,
			}}>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">
					{brandingIconUrl ? (
						<img
							src={brandingIconUrl}
							alt="Logo"
							className="h-full w-full object-cover"
						/>
					) : (
						<span className="text-xs text-white">★</span>
					)}
				</div>
				<div>
					<span className="text-sm font-semibold text-white">
						{branding.canteenName || "EDUTAP"}
					</span>
					<p className="text-xs text-white/70">{branding.schoolName || "School name"}</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 sm:justify-end">
				<span className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white">
					Share
				</span>
				<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20">
					<span className="text-xs font-bold text-white">S</span>
				</div>
			</div>
		</div>
	);
}

function AdminHeaderPreview({ branding }: { branding: BrandingState }) {
	const brandingIconUrl = getBrandingIconUrl(branding);

	return (
		<div
			className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
			style={{
				background: `linear-gradient(to right, ${branding.themeColor}dd, ${branding.themeColor})`,
			}}>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">
					{brandingIconUrl ? (
						<img
							src={brandingIconUrl}
							alt="Logo"
							className="h-full w-full object-cover"
						/>
					) : (
						<span className="text-xs text-white">★</span>
					)}
				</div>
				<div>
					<span className="text-sm font-semibold text-white">
						{branding.canteenName || "EDUTAP"}
					</span>
					<p className="text-xs text-white/70">{branding.schoolName || "School name"}</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 sm:justify-end">
				{["Dashboard", "Settings", "Users"].map((label, i) => (
					<span
						key={label}
						className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${
							i === 0
								? "bg-white text-red-900"
								: "border border-white/20 bg-white/10 text-white"
						}`}>
						{label}
					</span>
				))}
				<span className="rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-semibold text-red-900">
					Logout
				</span>
			</div>
		</div>
	);
}

// ── Main SettingsPage ──────────────────────────────────────────────────────
export function SettingsPage() {
	const [staffBranding, setStaffBranding] = useState<BrandingState>(DEFAULT_BRANDING);
	const [studentBranding, setStudentBranding] = useState<BrandingState>(DEFAULT_BRANDING);
	const [adminBranding, setAdminBranding] = useState<BrandingState>(DEFAULT_BRANDING);

	const [staffSaving, setStaffSaving] = useState(false);
	const [staffSaved, setStaffSaved] = useState(false);
	const [staffError, setStaffError] = useState<string | null>(null);

	const [studentSaving, setStudentSaving] = useState(false);
	const [studentSaved, setStudentSaved] = useState(false);
	const [studentError, setStudentError] = useState<string | null>(null);

	const [adminSaving, setAdminSaving] = useState(false);
	const [adminSaved, setAdminSaved] = useState(false);
	const [adminError, setAdminError] = useState<string | null>(null);

	const [activeTab, setActiveTab] = useState<BrandingTab>("staff");

	const [transactionsEnabled, setTransactionsEnabled] = useState(true);
	const [savingTx, setSavingTx] = useState(false);
	const [savedTx, setSavedTx] = useState(false);

	const [categories, setCategories] = useState<Category[]>([]);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [addingCategory, setAddingCategory] = useState(false);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(["staff", "student", "admin"] as BrandingTab[]).forEach((tab) => {
			const cached = readBrandingCache(tab);
			if (cached) {
				if (tab === "staff") setStaffBranding((p) => ({ ...p, ...cached }));
				if (tab === "student") setStudentBranding((p) => ({ ...p, ...cached }));
				if (tab === "admin") setAdminBranding((p) => ({ ...p, ...cached }));
			}
		});

		const ready = {
			staff: false,
			student: false,
			admin: false,
			tx: false,
			categories: false,
		};

		const markReady = (key: keyof typeof ready) => {
			ready[key] = true;
			if (Object.values(ready).every(Boolean)) {
				setLoading(false);
			}
		};

		const unsubStaff = subscribeToBrandingSettings((settings) => {
			setStaffBranding((p) => ({ ...p, ...settings }));
			markReady("staff");
		}, "staff");

		const unsubStudent = subscribeToBrandingSettings((settings) => {
			setStudentBranding((p) => ({ ...p, ...settings }));
			markReady("student");
		}, "student");

		const unsubAdmin = subscribeToBrandingSettings((settings) => {
			setAdminBranding((p) => ({ ...p, ...settings }));
			markReady("admin");
		}, "admin");

		const unsubTx = onSnapshot(doc(db, "settings", "transaction_control"), (snapshot) => {
			setTransactionsEnabled(snapshot.exists() ? (snapshot.data().enabled ?? true) : true);
			markReady("tx");
		});

		const unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
			setCategories(snapshot.docs.map((d) => ({ id: d.id, name: d.data().name as string })));
			markReady("categories");
		});

		return () => {
			unsubStaff();
			unsubStudent();
			unsubAdmin();
			unsubTx();
			unsubCategories();
		};
	}, []);

	const uploadAsset = async (file: File, assetKey: string): Promise<string> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
		formData.append("folder", "branding");
		formData.append("public_id", `${assetKey}-${Date.now()}`);

		const response = await fetch(
			`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
			{ method: "POST", body: formData },
		);
		if (!response.ok) throw new Error("Cloudinary upload failed");
		const data = (await response.json()) as { secure_url: string };
		return data.secure_url;
	};

	// Upload file if provided, skip blob URLs, keep existing HTTPS URLs as-is
	const resolveUrl = async (
		file: File | null,
		existingUrl: string | null,
		assetKey: string,
	): Promise<string | null> => {
		if (file) return uploadAsset(file, assetKey);
		if (existingUrl?.startsWith("blob:")) return null;
		return existingUrl ?? null;
	};

	const saveBranding = async (
		tab: BrandingTab,
		branding: BrandingState,
		files: PendingFiles,
		setSaving: (v: boolean) => void,
		setSaved: (v: boolean) => void,
		setError: (v: string | null) => void,
		setBranding: React.Dispatch<React.SetStateAction<BrandingState>>,
	) => {
		setSaving(true);
		setError(null);

		try {
			const [nextLogoUrl, nextFaviconUrl, nextLoginBgUrl] = await Promise.all([
				resolveUrl(files.logoFile, branding.logoUrl, `${tab}-logo`),
				resolveUrl(files.faviconFile, branding.faviconUrl, `${tab}-favicon`),
				branding.loginBgType === "image"
					? resolveUrl(files.loginBgFile, branding.loginBgUrl, `${tab}-login-bg`)
					: Promise.resolve(null),
			]);

			const payload = {
				schoolName: branding.schoolName,
				canteenName: branding.canteenName,
				themeColor: branding.themeColor,
				logoUrl: nextLogoUrl,
				faviconUrl: nextFaviconUrl,
				loginBgType: branding.loginBgType,
				loginBgColor: branding.loginBgColor,
				loginBgUrl: nextLoginBgUrl,
			};

			await setDoc(doc(db, "settings", `branding_${tab}`), payload);
			writeBrandingCache(payload, tab);

			// Replace blob previews with resolved HTTPS URLs in local state
			setBranding((p) => ({
				...p,
				logoUrl: nextLogoUrl,
				faviconUrl: nextFaviconUrl,
				loginBgUrl: nextLoginBgUrl,
			}));

			setSaved(true);
			setTimeout(() => setSaved(false), 2500);
		} catch (err) {
			console.error(`Failed to save ${tab} branding:`, err);
			setError("Upload failed. Check your Cloudinary preset and try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleToggleTransactions = async () => {
		const nextValue = !transactionsEnabled;
		setSavingTx(true);
		setSavedTx(false);
		setTransactionsEnabled(nextValue);
		try {
			await setDoc(doc(db, "settings", "transaction_control"), { enabled: nextValue });
			setSavedTx(true);
			setTimeout(() => setSavedTx(false), 2500);
		} catch (error) {
			console.error("Failed to update transaction state:", error);
			setTransactionsEnabled(!nextValue);
		} finally {
			setSavingTx(false);
		}
	};

	const handleAddCategory = async () => {
		const trimmed = newCategoryName.trim();
		if (!trimmed) return;
		setAddingCategory(true);
		setCategoryError(null);
		try {
			const ref = await addDoc(collection(db, "categories"), { name: trimmed });
			setCategories((c) => [...c, { id: ref.id, name: trimmed }]);
			setNewCategoryName("");
		} catch {
			setCategoryError("Failed to add category. Please try again.");
		} finally {
			setAddingCategory(false);
		}
	};

	const handleEditSave = async (id: string) => {
		const trimmed = editingName.trim();
		if (!trimmed) return;
		setCategoryError(null);
		try {
			await updateDoc(doc(db, "categories", id), { name: trimmed });
			setCategories((c) => c.map((cat) => (cat.id === id ? { ...cat, name: trimmed } : cat)));
			setEditingId(null);
		} catch (error) {
			console.error("Failed to rename category:", error);
			setCategoryError("Failed to rename category. Please try again.");
		}
	};

	const handleDeleteCategory = async (id: string, name: string) => {
		setCategoryError(null);
		setDeletingId(id);
		try {
			const productsSnap = await getDocs(
				query(collection(db, "products"), where("category", "==", name)),
			);
			if (!productsSnap.empty) {
				setCategoryError(
					`Cannot delete "${name}" — it still has ${productsSnap.size} product(s) assigned to it.`,
				);
				return;
			}
			await deleteDoc(doc(db, "categories", id));
			setCategories((c) => c.filter((cat) => cat.id !== id));
		} catch {
			setCategoryError("Failed to delete category.");
		} finally {
			setDeletingId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20 text-sm text-gray-400">
				<span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
				Loading settings...
			</div>
		);
	}

	const tabs: { key: BrandingTab; label: string; badge: string }[] = [
		{ key: "staff", label: "Staff / POS", badge: "Staff" },
		{ key: "student", label: "Student / Parent", badge: "Student" },
		{ key: "admin", label: "Admin", badge: "Admin" },
	];

	return (
		<div className="mx-auto max-w-6xl space-y-6 pb-12">
			{/* Hero */}
			<section className="settings-enter settings-delay-1 overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-950 via-red-900 to-red-800 text-white shadow-sm">
				<div className="grid gap-6 px-6 py-7 sm:px-7 lg:grid-cols-[1.35fr_0.65fr]">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100/80">
							Admin Settings
						</p>
						<h2 className="mt-3 text-3xl font-semibold tracking-tight">
							Shape how your EDUTAP workspace looks and behaves.
						</h2>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-red-100/85">
							Update school identity per interface, control transactions, and organize
							product categories from one place.
						</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
						<div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100/75">
								Transactions
							</p>
							<p className="mt-2 text-lg font-semibold">
								{transactionsEnabled ? "Enabled" : "Disabled"}
							</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100/75">
								Interfaces
							</p>
							<p className="mt-2 text-lg font-semibold">3 branded</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100/75">
								Categories
							</p>
							<p className="mt-2 text-lg font-semibold">{categories.length}</p>
						</div>
					</div>
				</div>
			</section>

			{/* Transaction controls */}
			<SectionCard
				className="settings-enter settings-delay-2"
				eyebrow="Operations"
				title="Global Transaction Controls"
				description="Pause or resume system-wide transaction activity for maintenance windows or emergency lockouts.">
				<div className="grid gap-5 lg:grid-cols-[1fr_220px]">
					<div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-base font-semibold text-gray-900">
									Transaction State
								</p>
								<p className="mt-1 text-sm text-gray-500">
									{transactionsEnabled
										? "Users can currently make purchases and top-ups."
										: "All purchase and top-up actions are currently blocked."}
								</p>
							</div>
							<span
								className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
									transactionsEnabled
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-700"
								}`}>
								{transactionsEnabled ? "ENABLED" : "DISABLED"}
							</span>
						</div>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white px-5 py-5">
						<p className="text-sm font-medium text-gray-800">Quick Toggle</p>
						<div className="mt-4 flex items-center justify-between">
							<span className="text-sm text-gray-500">
								{transactionsEnabled ? "Live" : "Paused"}
							</span>
							<button
								onClick={handleToggleTransactions}
								disabled={savingTx}
								className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
									transactionsEnabled ? "bg-red-950" : "bg-gray-300"
								} ${savingTx ? "opacity-60" : ""}`}
								role="switch"
								aria-checked={transactionsEnabled}>
								<span
									className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
										transactionsEnabled ? "translate-x-5" : "translate-x-0"
									}`}
								/>
							</button>
						</div>
						{savedTx && (
							<p className="mt-3 text-xs font-medium text-green-600">
								Transaction setting saved.
							</p>
						)}
					</div>
				</div>
			</SectionCard>

			{/* Branding — tabbed */}
			<SectionCard
				className="settings-enter settings-delay-3"
				eyebrow="Identity"
				title="Branding and Page Presentation"
				description="Customize branding independently for each interface — Staff, Student, and Admin.">
				<div className="mb-6 grid grid-cols-1 gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1 sm:grid-cols-3">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
								activeTab === tab.key
									? "bg-white text-gray-900 shadow-sm -translate-y-0.5"
									: "text-gray-500 hover:bg-white/70 hover:text-gray-700"
							}`}>
							{tab.label}
							{activeTab === tab.key && (
								<span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
									{tab.badge}
								</span>
							)}
						</button>
					))}
				</div>

				{activeTab === "staff" && (
					<BrandingPanel
						key="staff"
						branding={staffBranding}
						onChange={(next) => setStaffBranding((p) => ({ ...p, ...next }))}
						onSave={(files) =>
							saveBranding(
								"staff",
								staffBranding,
								files,
								setStaffSaving,
								setStaffSaved,
								setStaffError,
								setStaffBranding,
							)
						}
						saving={staffSaving}
						saved={staffSaved}
						error={staffError}
						saveLabel="Save Staff Branding"
						headerPreview={<StaffHeaderPreview branding={staffBranding} />}
					/>
				)}

				{activeTab === "student" && (
					<BrandingPanel
						key="student"
						branding={studentBranding}
						onChange={(next) => setStudentBranding((p) => ({ ...p, ...next }))}
						onSave={(files) =>
							saveBranding(
								"student",
								studentBranding,
								files,
								setStudentSaving,
								setStudentSaved,
								setStudentError,
								setStudentBranding,
							)
						}
						saving={studentSaving}
						saved={studentSaved}
						error={studentError}
						saveLabel="Save Student Branding"
						headerPreview={<StudentHeaderPreview branding={studentBranding} />}
					/>
				)}

				{activeTab === "admin" && (
					<BrandingPanel
						key="admin"
						branding={adminBranding}
						onChange={(next) => setAdminBranding((p) => ({ ...p, ...next }))}
						onSave={(files) =>
							saveBranding(
								"admin",
								adminBranding,
								files,
								setAdminSaving,
								setAdminSaved,
								setAdminError,
								setAdminBranding,
							)
						}
						saving={adminSaving}
						saved={adminSaved}
						error={adminError}
						saveLabel="Save Admin Branding"
						headerPreview={<AdminHeaderPreview branding={adminBranding} />}
					/>
				)}
			</SectionCard>

			{/* Category manager */}
			<SectionCard
				className="settings-enter settings-delay-4"
				eyebrow="Catalog"
				title="Category Manager"
				description="Add, rename, and remove product categories used by the inventory module.">
				<div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
					<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
						<p className="text-sm font-semibold text-gray-900">Create a New Category</p>
						<p className="mt-1 text-sm text-gray-500">
							Keep names short and consistent so inventory stays organized.
						</p>
						<div className="mt-4 space-y-3">
							<input
								type="text"
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") void handleAddCategory();
								}}
								placeholder="e.g. Beverages"
								className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
							/>
							<SaveButton
								saving={addingCategory}
								saved={false}
								onClick={() => void handleAddCategory()}
								label="Add Category"
							/>
						</div>
						<div className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
								Current Count
							</p>
							<p className="mt-2 text-2xl font-semibold text-gray-900">
								{categories.length}
							</p>
						</div>
					</div>

					<div>
						{categoryError && (
							<div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
								<div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-red-800">
										Category Action Failed
									</p>
									<p className="mt-1 text-sm text-red-700">{categoryError}</p>
								</div>
								<button
									type="button"
									onClick={() => setCategoryError(null)}
									className="text-sm font-medium text-red-500 hover:text-red-700">
									Close
								</button>
							</div>
						)}

						{categories.length === 0 ? (
							<div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 text-center text-sm text-gray-400">
								No categories yet. Add your first category from the left panel.
							</div>
						) : (
							<div className="grid gap-3 sm:grid-cols-2">
								{categories.map((category) => (
									<div
										key={category.id}
										className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0 flex-1">
												<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
													Category
												</p>
												{editingId === category.id ? (
													<input
														autoFocus
														type="text"
														value={editingName}
														onChange={(e) =>
															setEditingName(e.target.value)
														}
														onKeyDown={(e) => {
															if (e.key === "Enter")
																void handleEditSave(category.id);
															if (e.key === "Escape")
																setEditingId(null);
														}}
														className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
													/>
												) : (
													<h4 className="mt-2 truncate text-base font-semibold text-gray-900">
														{category.name}
													</h4>
												)}
											</div>
											<span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-900/60" />
										</div>
										<div className="mt-4 flex flex-wrap gap-2">
											{editingId === category.id ? (
												<>
													<button
														type="button"
														onClick={() =>
															void handleEditSave(category.id)
														}
														className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700">
														Save
													</button>
													<button
														type="button"
														onClick={() => setEditingId(null)}
														className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
														Cancel
													</button>
												</>
											) : (
												<>
													<button
														type="button"
														onClick={() => {
															setEditingId(category.id);
															setEditingName(category.name);
															setCategoryError(null);
														}}
														className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
														Rename
													</button>
													<button
														type="button"
														onClick={() =>
															void handleDeleteCategory(
																category.id,
																category.name,
															)
														}
														disabled={deletingId === category.id}
														className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
														{deletingId === category.id
															? "Deleting..."
															: "Delete"}
													</button>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</SectionCard>
		</div>
	);
}
