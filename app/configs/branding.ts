import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/configs/firebase";

export interface BrandingSettings {
	schoolName: string;
	canteenName: string;
	themeColor: string;
	logoUrl: string | null;
	faviconUrl: string | null;
	loginBgType: "color" | "image";
	loginBgColor: string;
	loginBgUrl: string | null;
}

type BrandingTab = "staff" | "student" | "admin";

const BRANDING_CACHE_KEY = "edutap_branding_cache_v1";
const BRANDING_STAFF_CACHE_KEY = "edutap_branding_staff_cache_v1";
const BRANDING_STUDENT_CACHE_KEY = "edutap_branding_student_cache_v1";
const BRANDING_ADMIN_CACHE_KEY = "edutap_branding_admin_cache_v1";

export const defaultBrandingSettings: BrandingSettings = {
	schoolName: "St. Clare College of Caloocan",
	canteenName: "EDUTAP",
	themeColor: "#7f1d1d",
	logoUrl: null,
	faviconUrl: null,
	loginBgType: "color",
	loginBgColor: "#7f1d1d",
	loginBgUrl: null,
};

function getCacheKey(tab?: "staff" | "student" | "admin"): string {
	if (tab === "staff") return BRANDING_STAFF_CACHE_KEY;
	if (tab === "student") return BRANDING_STUDENT_CACHE_KEY;
	if (tab === "admin") return BRANDING_ADMIN_CACHE_KEY;
	return BRANDING_CACHE_KEY;
}

export function readBrandingCache(tab?: "staff" | "student" | "admin"): BrandingSettings | null {
	if (typeof window === "undefined") return null;
	try {
		const rawValue = window.localStorage.getItem(getCacheKey(tab));
		if (!rawValue) return null;
		const parsed = JSON.parse(rawValue) as Partial<BrandingSettings>;
		return { ...defaultBrandingSettings, ...parsed };
	} catch (error) {
		console.error("Failed to read branding cache:", error);
		return null;
	}
}

export function writeBrandingCache(settings: BrandingSettings, tab?: "staff" | "student" | "admin") {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(getCacheKey(tab), JSON.stringify(settings));
	} catch (error) {
		console.error("Failed to write branding cache:", error);
	}
}

export function applyFavicon(faviconUrl: string | null) {
	if (typeof document === "undefined" || !faviconUrl) return;
	let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
	if (!favicon) {
		favicon = document.createElement("link");
		favicon.rel = "icon";
		document.head.appendChild(favicon);
	}
	favicon.href = faviconUrl;
}

function normalizeBrandingSettings(
	source: Partial<BrandingSettings> | undefined,
): BrandingSettings {
	return {
		schoolName: source?.schoolName ?? defaultBrandingSettings.schoolName,
		canteenName: source?.canteenName ?? defaultBrandingSettings.canteenName,
		themeColor: source?.themeColor ?? defaultBrandingSettings.themeColor,
		logoUrl: source?.logoUrl ?? defaultBrandingSettings.logoUrl,
		faviconUrl: source?.faviconUrl ?? defaultBrandingSettings.faviconUrl,
		loginBgType: source?.loginBgType ?? defaultBrandingSettings.loginBgType,
		loginBgColor: source?.loginBgColor ?? defaultBrandingSettings.loginBgColor,
		loginBgUrl: source?.loginBgUrl ?? defaultBrandingSettings.loginBgUrl,
	};
}

export function subscribeToBrandingSettings(
	callback: (settings: BrandingSettings) => void,
	tab?: BrandingTab,
) {
	if (tab) {
		const tabRef = doc(db, "settings", `branding_${tab}`);
		const sharedInfoRef = doc(db, "settings", "canteen_info");
		const sharedBrandingRef = doc(db, "settings", "branding");

		let tabData: Partial<BrandingSettings> | null = null;
		let sharedInfo: Partial<BrandingSettings> = {};
		let sharedBranding: Partial<BrandingSettings> = {};

		const emit = () => {
			if (tabData) {
				const nextSettings = normalizeBrandingSettings(tabData);
				writeBrandingCache(nextSettings, tab);
				callback(nextSettings);
				return;
			}

			const nextSettings = normalizeBrandingSettings({
				...sharedBranding,
				schoolName: sharedInfo.schoolName ?? sharedBranding.schoolName,
				canteenName: sharedInfo.canteenName ?? sharedBranding.canteenName,
			});
			writeBrandingCache(nextSettings, tab);
			callback(nextSettings);
		};

		const unsubTab = onSnapshot(tabRef, (snapshot) => {
			tabData = snapshot.exists() ? (snapshot.data() as Partial<BrandingSettings>) : null;
			emit();
		});

		const unsubInfo = onSnapshot(sharedInfoRef, (snapshot) => {
			sharedInfo = snapshot.exists()
				? (snapshot.data() as Partial<BrandingSettings>)
				: {};
			emit();
		});

		const unsubShared = onSnapshot(sharedBrandingRef, (snapshot) => {
			sharedBranding = snapshot.exists()
				? (snapshot.data() as Partial<BrandingSettings>)
				: {};
			emit();
		});

		return () => {
			unsubTab();
			unsubInfo();
			unsubShared();
		};
	}

	const sharedInfoRef = doc(db, "settings", "canteen_info");
	const sharedBrandingRef = doc(db, "settings", "branding");
	let sharedInfo: Partial<BrandingSettings> = {};
	let sharedBranding: Partial<BrandingSettings> = {};

	const emit = () => {
		const nextSettings = normalizeBrandingSettings({
			...sharedBranding,
			schoolName: sharedInfo.schoolName ?? sharedBranding.schoolName,
			canteenName: sharedInfo.canteenName ?? sharedBranding.canteenName,
		});
		writeBrandingCache(nextSettings);
		callback(nextSettings);
	};

	const unsubInfo = onSnapshot(sharedInfoRef, (snapshot) => {
		sharedInfo = snapshot.exists() ? (snapshot.data() as Partial<BrandingSettings>) : {};
		emit();
	});

	const unsubShared = onSnapshot(sharedBrandingRef, (snapshot) => {
		sharedBranding = snapshot.exists()
			? (snapshot.data() as Partial<BrandingSettings>)
			: {};
		emit();
	});

	return () => {
		unsubInfo();
		unsubShared();
	};
}

// Original shared fetch — still used as fallback
export async function fetchBrandingSettings(): Promise<BrandingSettings> {
	const [infoSnap, brandingSnap] = await Promise.all([
		getDoc(doc(db, "settings", "canteen_info")),
		getDoc(doc(db, "settings", "branding")),
	]);

	const info = infoSnap.exists() ? infoSnap.data() : {};
	const branding = brandingSnap.exists() ? brandingSnap.data() : {};

	const mergedSettings: BrandingSettings = {
		schoolName: info.schoolName ?? defaultBrandingSettings.schoolName,
		canteenName: info.canteenName ?? defaultBrandingSettings.canteenName,
		themeColor: branding.themeColor ?? defaultBrandingSettings.themeColor,
		logoUrl: branding.logoUrl ?? defaultBrandingSettings.logoUrl,
		faviconUrl: branding.faviconUrl ?? defaultBrandingSettings.faviconUrl,
		loginBgType: branding.loginBgType ?? defaultBrandingSettings.loginBgType,
		loginBgColor: branding.loginBgColor ?? defaultBrandingSettings.loginBgColor,
		loginBgUrl: branding.loginBgUrl ?? defaultBrandingSettings.loginBgUrl,
	};

	writeBrandingCache(mergedSettings);
	return mergedSettings;
}

// Per-tab fetch — reads from settings/branding_staff, branding_student, branding_admin
// Falls back to the shared branding doc if the tab doc doesn't exist yet
export async function fetchBrandingSettingsForTab(
	tab: "staff" | "student" | "admin",
): Promise<BrandingSettings> {
	const tabSnap = await getDoc(doc(db, "settings", `branding_${tab}`));

	if (tabSnap.exists()) {
		const data = tabSnap.data();
		const settings: BrandingSettings = {
			schoolName: data.schoolName ?? defaultBrandingSettings.schoolName,
			canteenName: data.canteenName ?? defaultBrandingSettings.canteenName,
			themeColor: data.themeColor ?? defaultBrandingSettings.themeColor,
			logoUrl: data.logoUrl ?? defaultBrandingSettings.logoUrl,
			faviconUrl: data.faviconUrl ?? defaultBrandingSettings.faviconUrl,
			loginBgType: data.loginBgType ?? defaultBrandingSettings.loginBgType,
			loginBgColor: data.loginBgColor ?? defaultBrandingSettings.loginBgColor,
			loginBgUrl: data.loginBgUrl ?? defaultBrandingSettings.loginBgUrl,
		};
		writeBrandingCache(settings, tab);
		return settings;
	}

	// Fallback to shared branding
	const shared = await fetchBrandingSettings();
	writeBrandingCache(shared, tab);
	return shared;
}
