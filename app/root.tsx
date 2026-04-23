import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import {
	defaultBrandingSettings,
	readBrandingCache,
	subscribeToBrandingSettings,
	type BrandingSettings,
} from "@/configs/branding";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{ rel: "manifest", href: "/manifest.webmanifest" },
];

function ensureMetaTag(name: string, content: string) {
	if (typeof document === "undefined") return;

	let tag = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
	if (!tag) {
		tag = document.createElement("meta");
		tag.name = name;
		document.head.appendChild(tag);
	}

	tag.content = content;
}

function ensureManifestLink(href: string) {
	if (typeof document === "undefined") return;

	let tag = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
	if (!tag) {
		tag = document.createElement("link");
		tag.rel = "manifest";
		document.head.appendChild(tag);
	}

	tag.href = href;
}

function buildManifest(settings: BrandingSettings) {
	const iconUrl = settings.logoUrl || settings.faviconUrl || "/logo.png";
	const appName = `${settings.canteenName} - ${settings.schoolName}`;

	return {
		name: appName,
		short_name: settings.canteenName,
		description: `${settings.canteenName} digital canteen app for ${settings.schoolName}`,
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: settings.themeColor,
		icons: [
			{
				src: iconUrl,
				sizes: "192x192",
				type: "image/png",
				purpose: "any maskable",
			},
			{
				src: iconUrl,
				sizes: "512x512",
				type: "image/png",
				purpose: "any maskable",
			},
		],
		shortcuts: [
			{
				name: "Open Admin Panel",
				short_name: "Admin",
				url: "/admin-panel",
			},
			{
				name: "Open Staff Panel",
				short_name: "Staff",
				url: "/user-panel",
			},
		],
	};
}

function AppShellEnhancements() {
	const [branding, setBranding] = useState<BrandingSettings>(defaultBrandingSettings);

	useEffect(() => {
		const cachedBranding = readBrandingCache();
		if (cachedBranding) {
			setBranding(cachedBranding);
		}

		const unsubscribe = subscribeToBrandingSettings((nextBranding) => {
			setBranding(nextBranding);
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!("serviceWorker" in navigator)) return;

		navigator.serviceWorker.register("/sw.js").catch((error) => {
			console.error("Service worker registration failed:", error);
		});
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		document.title = branding.canteenName;
		ensureMetaTag("theme-color", branding.themeColor);
		ensureMetaTag("apple-mobile-web-app-capable", "yes");
		ensureMetaTag("apple-mobile-web-app-status-bar-style", "default");
		ensureMetaTag("apple-mobile-web-app-title", branding.canteenName);

		const manifestBlob = new Blob([JSON.stringify(buildManifest(branding))], {
			type: "application/manifest+json",
		});
		const manifestUrl = URL.createObjectURL(manifestBlob);
		ensureManifestLink(manifestUrl);

		return () => {
			URL.revokeObjectURL(manifestUrl);
		};
	}, [branding]);

	return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<AppShellEnhancements />
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
