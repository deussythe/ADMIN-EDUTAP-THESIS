import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, useMatches, useActionData, useLoaderData, useParams, useRouteError, Meta, Links, ScrollRestoration, Scripts, Outlet, isRouteErrorResponse, useNavigate } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createElement, useState, useEffect, useMemo, useRef } from "react";
import { getFirestore, doc, onSnapshot, getDoc, query, collection, orderBy, limit, where, updateDoc, addDoc, runTransaction, setDoc, serverTimestamp, deleteDoc, getDocs } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { ShoppingCart, AlertCircle, Download, History, Search, Users, Clock, Bell, LogOut, Receipt, CreditCard, X, Check, Plus, Phone, Edit2, Loader, Box, AlertTriangle, PackageX, Trash2, Link, Upload, Home, UserPlus, Settings, Archive, RotateCcw, Link2 } from "lucide-react";
import { createPortal } from "react-dom";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function withComponentProps(Component) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      matches: useMatches()
    };
    return createElement(Component, props);
  };
}
function withErrorBoundaryProps(ErrorBoundary3) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      error: useRouteError()
    };
    return createElement(ErrorBoundary3, props);
  };
}
const firebaseConfig = {
  apiKey: "AIzaSyCNe8-dYnbPW5Ja8Ixb9xuxB0PIwWu2-Ns",
  authDomain: "edutap-thesis.firebaseapp.com",
  databaseURL: "https://edutap-thesis-default-rtdb.firebaseio.com",
  projectId: "edutap-thesis",
  storageBucket: "edutap-thesis.firebasestorage.app",
  messagingSenderId: "925689449246",
  appId: "1:925689449246:web:50092c0c3f35c73e39170f",
  measurementId: "G-S0LN7ZY452"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
getDatabase(app);
getStorage(app);
getFunctions(app);
const BRANDING_CACHE_KEY = "edutap_branding_cache_v1";
const BRANDING_STAFF_CACHE_KEY = "edutap_branding_staff_cache_v1";
const BRANDING_STUDENT_CACHE_KEY = "edutap_branding_student_cache_v1";
const BRANDING_ADMIN_CACHE_KEY = "edutap_branding_admin_cache_v1";
const defaultBrandingSettings = {
  schoolName: "St. Clare College of Caloocan",
  canteenName: "EDUTAP",
  themeColor: "#7f1d1d",
  logoUrl: null,
  faviconUrl: null,
  loginBgType: "color",
  loginBgColor: "#7f1d1d",
  loginBgUrl: null
};
function getFallbackBrandingSettings(tab) {
  return readBrandingCache(tab) ?? defaultBrandingSettings;
}
function getCacheKey(tab) {
  if (tab === "staff") return BRANDING_STAFF_CACHE_KEY;
  if (tab === "student") return BRANDING_STUDENT_CACHE_KEY;
  if (tab === "admin") return BRANDING_ADMIN_CACHE_KEY;
  return BRANDING_CACHE_KEY;
}
function readBrandingCache(tab) {
  if (typeof window === "undefined") return null;
  try {
    const rawValue = window.localStorage.getItem(getCacheKey(tab));
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue);
    return { ...defaultBrandingSettings, ...parsed };
  } catch (error) {
    console.error("Failed to read branding cache:", error);
    return null;
  }
}
function writeBrandingCache(settings, tab) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getCacheKey(tab), JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to write branding cache:", error);
  }
}
function applyFavicon(faviconUrl) {
  if (typeof document === "undefined" || !faviconUrl) return;
  let favicon = document.querySelector("link[rel='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = faviconUrl;
}
function normalizeBrandingSettings(source) {
  return {
    schoolName: (source == null ? void 0 : source.schoolName) ?? defaultBrandingSettings.schoolName,
    canteenName: (source == null ? void 0 : source.canteenName) ?? defaultBrandingSettings.canteenName,
    themeColor: (source == null ? void 0 : source.themeColor) ?? defaultBrandingSettings.themeColor,
    logoUrl: (source == null ? void 0 : source.logoUrl) ?? defaultBrandingSettings.logoUrl,
    faviconUrl: (source == null ? void 0 : source.faviconUrl) ?? defaultBrandingSettings.faviconUrl,
    loginBgType: (source == null ? void 0 : source.loginBgType) ?? defaultBrandingSettings.loginBgType,
    loginBgColor: (source == null ? void 0 : source.loginBgColor) ?? defaultBrandingSettings.loginBgColor,
    loginBgUrl: (source == null ? void 0 : source.loginBgUrl) ?? defaultBrandingSettings.loginBgUrl
  };
}
function subscribeToBrandingSettings(callback, tab) {
  let isActive = true;
  let hasHandledError = false;
  let unsubscribers = [];
  const cleanupListeners = () => {
    const currentUnsubscribers = unsubscribers;
    unsubscribers = [];
    currentUnsubscribers.forEach((unsubscribe) => unsubscribe());
  };
  const handleError = (error) => {
    if (!isActive || hasHandledError) return;
    hasHandledError = true;
    cleanupListeners();
    callback(getFallbackBrandingSettings(tab));
    console.warn("Branding subscription failed; using cached branding instead.", error);
  };
  if (tab) {
    const tabRef = doc(db, "settings", `branding_${tab}`);
    const sharedInfoRef2 = doc(db, "settings", "canteen_info");
    const sharedBrandingRef2 = doc(db, "settings", "branding");
    let tabData = null;
    let sharedInfo2 = {};
    let sharedBranding2 = {};
    const emit2 = () => {
      if (tabData) {
        const nextSettings2 = normalizeBrandingSettings(tabData);
        writeBrandingCache(nextSettings2, tab);
        callback(nextSettings2);
        return;
      }
      const nextSettings = normalizeBrandingSettings({
        ...sharedBranding2,
        schoolName: sharedInfo2.schoolName ?? sharedBranding2.schoolName,
        canteenName: sharedInfo2.canteenName ?? sharedBranding2.canteenName
      });
      writeBrandingCache(nextSettings, tab);
      callback(nextSettings);
    };
    unsubscribers = [
      onSnapshot(
        tabRef,
        (snapshot) => {
          tabData = snapshot.exists() ? snapshot.data() : null;
          emit2();
        },
        handleError
      ),
      onSnapshot(
        sharedInfoRef2,
        (snapshot) => {
          sharedInfo2 = snapshot.exists() ? snapshot.data() : {};
          emit2();
        },
        handleError
      ),
      onSnapshot(
        sharedBrandingRef2,
        (snapshot) => {
          sharedBranding2 = snapshot.exists() ? snapshot.data() : {};
          emit2();
        },
        handleError
      )
    ];
    return () => {
      isActive = false;
      cleanupListeners();
    };
  }
  const sharedInfoRef = doc(db, "settings", "canteen_info");
  const sharedBrandingRef = doc(db, "settings", "branding");
  let sharedInfo = {};
  let sharedBranding = {};
  const emit = () => {
    const nextSettings = normalizeBrandingSettings({
      ...sharedBranding,
      schoolName: sharedInfo.schoolName ?? sharedBranding.schoolName,
      canteenName: sharedInfo.canteenName ?? sharedBranding.canteenName
    });
    writeBrandingCache(nextSettings);
    callback(nextSettings);
  };
  unsubscribers = [
    onSnapshot(
      sharedInfoRef,
      (snapshot) => {
        sharedInfo = snapshot.exists() ? snapshot.data() : {};
        emit();
      },
      handleError
    ),
    onSnapshot(
      sharedBrandingRef,
      (snapshot) => {
        sharedBranding = snapshot.exists() ? snapshot.data() : {};
        emit();
      },
      handleError
    )
  ];
  return () => {
    isActive = false;
    cleanupListeners();
  };
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}, {
  rel: "manifest",
  href: "/manifest.webmanifest"
}];
function ensureMetaTag(name, content) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector(`meta[name='${name}']`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}
function ensureManifestLink(href) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector("link[rel='manifest']");
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "manifest";
    document.head.appendChild(tag);
  }
  tag.href = href;
}
function toAbsoluteUrl(path, origin) {
  return new URL(path, origin).toString();
}
function buildManifest(settings, origin) {
  const iconUrl = toAbsoluteUrl(settings.logoUrl || settings.faviconUrl || "/logo.png", origin);
  const appRootUrl = toAbsoluteUrl("/", origin);
  const appName = `${settings.canteenName} - ${settings.schoolName}`;
  return {
    id: appRootUrl,
    name: appName,
    short_name: settings.canteenName,
    description: `${settings.canteenName} digital canteen app for ${settings.schoolName}`,
    start_url: appRootUrl,
    scope: appRootUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: settings.themeColor,
    icons: [{
      src: iconUrl,
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    }, {
      src: iconUrl,
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }],
    shortcuts: [{
      name: "Open Admin Panel",
      short_name: "Admin",
      url: toAbsoluteUrl("/admin-panel", origin)
    }, {
      name: "Open Staff Panel",
      short_name: "Staff",
      url: toAbsoluteUrl("/user-panel", origin)
    }]
  };
}
function AppShellEnhancements() {
  const [branding, setBranding] = useState(defaultBrandingSettings);
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
    ensureMetaTag("mobile-web-app-capable", "yes");
    ensureMetaTag("apple-mobile-web-app-status-bar-style", "default");
    ensureMetaTag("apple-mobile-web-app-title", branding.canteenName);
    const manifestBlob = new Blob([JSON.stringify(buildManifest(branding, window.location.origin))], {
      type: "application/manifest+json"
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    ensureManifestLink(manifestUrl);
    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, [branding]);
  return null;
}
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(AppShellEnhancements, {}), children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(
    null
  );
  const [schoolName, setSchoolName] = useState(defaultBrandingSettings.schoolName);
  const [canteenName, setCanteenName] = useState(defaultBrandingSettings.canteenName);
  const [themeColor, setThemeColor] = useState(defaultBrandingSettings.themeColor);
  const [logoUrl, setLogoUrl] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [loginBgType, setLoginBgType] = useState(
    defaultBrandingSettings.loginBgType
  );
  const [loginBgColor, setLoginBgColor] = useState(defaultBrandingSettings.loginBgColor);
  const [loginBgUrl, setLoginBgUrl] = useState(null);
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
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      const code = err.code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
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
  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };
  const loginHeaderIcon = faviconUrl || logoUrl;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "flex min-h-screen items-center justify-center p-4",
      style: loginBgType === "image" && loginBgUrl ? {
        backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.35), rgba(17, 24, 39, 0.55)), url(${loginBgUrl})`,
        backgroundPosition: "center",
        backgroundSize: "cover"
      } : {
        background: `linear-gradient(135deg, ${themeColor}, ${loginBgColor})`
      },
      children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-xl border border-red-700 bg-white shadow-2xl", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "space-y-3 rounded-t-xl p-6 text-center",
            style: {
              background: `linear-gradient(90deg, ${themeColor}, ${themeColor}dd)`
            },
            children: [
              /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg", children: loginHeaderIcon ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: loginHeaderIcon,
                  alt: "School logo",
                  className: "h-full w-full object-cover"
                }
              ) : /* @__PURE__ */ jsx(ShoppingCart, { className: "h-8 w-8", style: { color: themeColor } }) }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white", children: canteenName }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-red-100", children: schoolName })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-gray-600 mb-6", children: "Sign in to access your dashboard" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "text-sm font-medium text-gray-700", children: "Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "email",
                  type: "email",
                  placeholder: "Enter your email",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  onKeyDown: (e) => e.key === "Enter" && handleSubmit(e),
                  autoComplete: "email",
                  autoFocus: true,
                  disabled: isLoading,
                  className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "text-sm font-medium text-gray-700", children: "Password" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "password",
                  type: "password",
                  placeholder: "Enter your password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  onKeyDown: (e) => e.key === "Enter" && handleSubmit(e),
                  autoComplete: "current-password",
                  disabled: isLoading,
                  className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                }
              )
            ] }),
            error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200", children: [
              /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { children: error })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleSubmit,
                disabled: isLoading,
                className: "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-gray-400",
                style: { backgroundColor: themeColor },
                children: isLoading ? "Signing in..." : "Sign In"
              }
            ),
            installPromptEvent && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: handleInstallApp,
                className: "flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50",
                children: [
                  /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Install App Shortcut" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-gray-500", children: "Install this on school or canteen devices for one-click opening from the desktop or home screen." })
          ] })
        ] })
      ] })
    }
  );
}
async function loader() {
  return null;
}
const loginPage = withComponentProps(function LoginPage() {
  const handleLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw {
        code: "auth/user-not-found"
      };
    }
    const role = userDoc.data().role.toLowerCase();
    localStorage.setItem("username", user.displayName || user.email || "");
    localStorage.setItem("role", role);
    if (role === "admin") {
      window.location.href = "/admin-panel";
    } else if (role === "staff") {
      window.location.href = "/user-panel";
    } else if (role === "parent") {
      window.location.href = "/parent-dashboard";
    } else {
      throw {
        code: "auth/invalid-credential"
      };
    }
  };
  return /* @__PURE__ */ jsx("div", {
    children: /* @__PURE__ */ jsx(LoginForm, {
      onLogin: handleLogin
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: loginPage,
  loader
}, Symbol.toStringTag, { value: "Module" }));
function AdminModalPortal({ children }) {
  if (typeof document === "undefined") {
    return null;
  }
  return createPortal(children, document.body);
}
function ActivityModal({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx(AdminModalPortal, { children: /* @__PURE__ */ jsx("div", { className: "admin-dialog-backdrop", children: /* @__PURE__ */ jsxs("div", { className: "admin-modal-panel settings-enter max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl", children: [
    /* @__PURE__ */ jsx("h3", { className: "mb-3 text-lg font-semibold text-gray-900", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mb-6 text-sm leading-6 text-gray-600", children: message }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200",
          children: "Close"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "rounded-xl bg-red-950 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg",
          children: "Got it"
        }
      )
    ] })
  ] }) }) });
}
const actionStyles = {
  created: "bg-emerald-100 text-emerald-700",
  updated: "bg-amber-100 text-amber-700",
  deleted: "bg-red-100 text-red-700",
  requested: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  purchase: "bg-violet-100 text-violet-700"
};
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function formatAuditKey(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (char) => char.toUpperCase());
}
function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return formatAuditValue(value);
  }
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
function formatAuditValue(value) {
  if (value === null || value === void 0 || value === "") {
    return "N/A";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "N/A";
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) => formatAuditValue(item)).filter((item) => item !== "N/A");
    return parts.length > 0 ? parts.join(", ") : "N/A";
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== void 0).map(([entryKey, entryValue]) => `${formatAuditKey(entryKey)}: ${formatAuditValue(entryValue)}`);
    return entries.length > 0 ? entries.join(", ") : "N/A";
  }
  return String(value);
}
function getAuditDetailLines(details) {
  if (details === null || details === void 0 || details === "") {
    return ["No details recorded."];
  }
  if (typeof details === "string" || typeof details === "number" || typeof details === "boolean") {
    return [String(details)];
  }
  if (Array.isArray(details)) {
    const items = details.map((item) => formatAuditValue(item)).filter((item) => item !== "N/A");
    return items.length > 0 ? items : ["No details recorded."];
  }
  if (isRecord(details)) {
    const preferredKeys = [
      "source",
      "studentName",
      "staffName",
      "amount",
      "total",
      "paymentMethod",
      "referenceNo",
      "orderId",
      "status",
      "previousBalance",
      "newBalance",
      "items",
      "changedFields",
      "before",
      "after"
    ];
    const lines = preferredKeys.filter((key) => key in details && details[key] !== void 0).map((key) => {
      const rawValue = details[key];
      const formattedValue = key === "amount" || key === "total" || key === "previousBalance" || key === "newBalance" ? formatCurrency(rawValue) : formatAuditValue(rawValue);
      return `${formatAuditKey(key)}: ${formattedValue}`;
    });
    const additionalLines = Object.entries(details).filter(([key, value]) => !preferredKeys.includes(key) && value !== void 0).map(([key, value]) => `${formatAuditKey(key)}: ${formatAuditValue(value)}`);
    const output = [...lines, ...additionalLines];
    return output.length > 0 ? output : ["No details recorded."];
  }
  return [String(details)];
}
function getSearchableLogText(log) {
  return [
    log.targetName,
    log.actorLabel,
    log.action,
    log.targetType,
    ...getAuditDetailLines(log.details)
  ].filter(Boolean).join(" ").toLowerCase();
}
function getTargetTypeLabel(targetType) {
  switch (targetType) {
    case "topup":
      return "Top-up";
    case "transaction":
      return "Purchase";
    default:
      return targetType;
  }
}
function mapTopUpRequestToActivity(log) {
  if (typeof log.timestamp !== "number") {
    return null;
  }
  const actorLabel = log.requesterName || log.requestedByName || log.requestedBy || log.guardianName || log.guardianEmail || log.parentEmail || "Parent / Student";
  return {
    id: `topup-request-${log.id}`,
    action: "requested",
    targetType: "topup",
    targetId: log.id,
    targetName: `Top-up for ${log.studentName || "Unknown student"}`,
    details: {
      source: log.source || "parent panel",
      studentName: log.studentName || "Unknown student",
      amount: typeof log.amount === "number" ? log.amount : void 0,
      paymentMethod: log.paymentMethod || "GCash",
      referenceNo: log.referenceNo || "N/A",
      status: log.status || "pending"
    },
    actorLabel,
    timestamp: log.timestamp,
    sourceCollection: "topup_requests"
  };
}
function mapTransactionToActivity(log) {
  if (typeof log.timestamp !== "number") {
    return null;
  }
  return {
    id: `transaction-${log.id}`,
    action: "purchase",
    targetType: "transaction",
    targetId: log.id,
    targetName: log.orderId ? `Order ${log.orderId}` : `Transaction ${log.id}`,
    details: {
      source: "cashier panel",
      orderId: log.orderId || "N/A",
      staffName: log.staffName || "Cashier",
      studentName: log.studentName || void 0,
      total: typeof log.total === "number" ? log.total : void 0,
      status: log.status || "Completed",
      items: Array.isArray(log.items) ? log.items.map(
        (item) => (item == null ? void 0 : item.name) ? `${item.name}${typeof item.quantity === "number" ? ` x${item.quantity}` : ""}` : null
      ).filter(Boolean) : void 0
    },
    actorLabel: log.staffName || "Cashier",
    timestamp: log.timestamp,
    sourceCollection: "transactions"
  };
}
function AccountLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [topUpActivities, setTopUpActivities] = useState([]);
  const [transactionActivities, setTransactionActivities] = useState([]);
  const [readyState, setReadyState] = useState({
    audit: false,
    topups: false,
    transactions: false
  });
  const [errorState, setErrorState] = useState({});
  const [search, setSearch] = useState("");
  useEffect(() => {
    const logsQuery = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        setAuditLogs(
          snapshot.docs.map(
            (snapshotDoc) => ({
              id: snapshotDoc.id,
              sourceCollection: "audit_logs",
              ...snapshotDoc.data()
            })
          )
        );
        setErrorState((current) => ({ ...current, audit: void 0 }));
        setReadyState((current) => ({ ...current, audit: true }));
      },
      (snapshotError) => {
        console.error("Failed to load audit logs:", snapshotError);
        setErrorState((current) => ({
          ...current,
          audit: snapshotError.code === "permission-denied" ? "Audit logs are blocked by Firestore rules." : "Unable to load audit logs right now."
        }));
        setReadyState((current) => ({ ...current, audit: true }));
      }
    );
    return unsubscribe;
  }, []);
  useEffect(() => {
    const topUpsQuery = query(
      collection(db, "topup_requests"),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      topUpsQuery,
      (snapshot) => {
        setTopUpActivities(
          snapshot.docs.map(
            (snapshotDoc) => mapTopUpRequestToActivity({
              id: snapshotDoc.id,
              ...snapshotDoc.data()
            })
          ).filter((entry2) => entry2 !== null)
        );
        setErrorState((current) => ({ ...current, topups: void 0 }));
        setReadyState((current) => ({ ...current, topups: true }));
      },
      (snapshotError) => {
        console.error("Failed to load top-up activity:", snapshotError);
        setErrorState((current) => ({
          ...current,
          topups: snapshotError.code === "permission-denied" ? "Top-up activity is blocked by Firestore rules." : "Unable to load top-up activity right now."
        }));
        setReadyState((current) => ({ ...current, topups: true }));
      }
    );
    return unsubscribe;
  }, []);
  useEffect(() => {
    const transactionsQuery = query(
      collection(db, "transactions"),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        setTransactionActivities(
          snapshot.docs.map(
            (snapshotDoc) => mapTransactionToActivity({
              id: snapshotDoc.id,
              ...snapshotDoc.data()
            })
          ).filter((entry2) => entry2 !== null)
        );
        setErrorState((current) => ({ ...current, transactions: void 0 }));
        setReadyState((current) => ({ ...current, transactions: true }));
      },
      (snapshotError) => {
        console.error("Failed to load transaction activity:", snapshotError);
        setErrorState((current) => ({
          ...current,
          transactions: snapshotError.code === "permission-denied" ? "Transaction activity is blocked by Firestore rules." : "Unable to load transaction activity right now."
        }));
        setReadyState((current) => ({ ...current, transactions: true }));
      }
    );
    return unsubscribe;
  }, []);
  const loading = !readyState.audit || !readyState.topups || !readyState.transactions;
  const errors = Object.values(errorState).filter(Boolean);
  const combinedLogs = useMemo(
    () => [...auditLogs, ...topUpActivities, ...transactionActivities].sort(
      (a, b) => b.timestamp - a.timestamp
    ),
    [auditLogs, topUpActivities, transactionActivities]
  );
  const filteredLogs = useMemo(
    () => combinedLogs.filter((log) => {
      const queryText = search.toLowerCase();
      return getSearchableLogText(log).includes(queryText);
    }),
    [combinedLogs, search]
  );
  return /* @__PURE__ */ jsxs("div", { className: "settings-enter settings-delay-2 admin-surface overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-red-100 p-3 text-red-900", children: /* @__PURE__ */ jsx(History, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Activity Logs" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "View recent account changes, top-up requests, approvals, and cashier transactions in one stream." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: search,
            onChange: (event) => setSearch(event.target.value),
            placeholder: "Search by target, actor, action, source, or details...",
            className: "w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-gray-500", children: search ? `${filteredLogs.length} matching log(s)` : `${combinedLogs.length} recent activity log(s)` }),
      errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Some activity sources could not be loaded" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 space-y-1", children: errors.map((error) => /* @__PURE__ */ jsx("p", { children: error }, error)) })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex h-40 items-center justify-center text-sm text-gray-500", children: "Loading logs..." }) : filteredLogs.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400", children: "No activity logs found." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Time" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Action" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Target" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Changed By" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Details" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: filteredLogs.map((log) => /* @__PURE__ */ jsxs(
          "tr",
          {
            className: "border-b border-gray-100 align-top transition-colors duration-300 hover:bg-red-50/30",
            children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-sm text-gray-600", children: new Date(log.timestamp).toLocaleString("en-PH") }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${actionStyles[log.action] ?? "bg-gray-100 text-gray-700"}`,
                  children: formatAuditKey(log.action)
                }
              ) }),
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-4 text-sm text-gray-800", children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: log.targetName }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs uppercase tracking-[0.16em] text-gray-400", children: getTargetTypeLabel(log.targetType) })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-sm text-gray-600", children: log.actorLabel || "System" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-sm leading-6 text-gray-600", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: getAuditDetailLines(log.details).map((line, index) => /* @__PURE__ */ jsx("p", { children: line }, `${log.id}-detail-${index}`)) }) })
            ]
          },
          log.id
        )) })
      ] }) })
    ] })
  ] });
}
function AdminHeader({ displayName, role, currentTime, onLogout }) {
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState(null);
  const [schoolName, setSchoolName] = useState("St. Clare College of Caloocan");
  const [canteenName, setCanteenName] = useState("EDUTAP");
  const [logoUrl, setLogoUrl] = useState(null);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const cachedBranding = readBrandingCache();
    if (cachedBranding) {
      setSchoolName(cachedBranding.schoolName);
      setCanteenName(cachedBranding.canteenName);
      setLogoUrl(cachedBranding.logoUrl);
      applyFavicon(cachedBranding.faviconUrl);
    }
    const unsubscribe = subscribeToBrandingSettings((branding) => {
      setSchoolName(branding.schoolName);
      setCanteenName(branding.canteenName);
      setLogoUrl(branding.logoUrl);
      applyFavicon(branding.faviconUrl);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("target", "==", "admin"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setNotificationError(null);
        setNotifications(
          snapshot.docs.map(
            (snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })
          )
        );
      },
      (error) => {
        console.error("Failed to subscribe to notifications:", error);
        setNotificationError("Notifications could not be loaded right now.");
      }
    );
    return unsubscribe;
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const markAllRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    if (unread.length === 0) return;
    try {
      setNotificationError(null);
      await Promise.all(
        unread.map(
          (notification) => updateDoc(doc(db, "notifications", notification.id), { read: true })
        )
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      setNotificationError("Couldn't mark notifications as read. Please try again.");
    }
  };
  const markOneRead = async (id) => {
    try {
      setNotificationError(null);
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setNotificationError("Couldn't update this notification. Please try again.");
    }
  };
  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 6e4);
    const hours = Math.floor(diff / 36e5);
    const days = Math.floor(diff / 864e5);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  const typeLabel = (type) => {
    switch (type) {
      case "student":
        return "Student";
      case "topup":
        return "Top-Up";
      case "transaction":
        return "Transaction";
      default:
        return "Notice";
    }
  };
  const typeIcon = (type) => {
    switch (type) {
      case "student":
        return /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" });
      case "topup":
        return /* @__PURE__ */ jsx(CreditCard, { className: "h-4 w-4" });
      case "transaction":
        return /* @__PURE__ */ jsx(Receipt, { className: "h-4 w-4" });
      default:
        return /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" });
    }
  };
  const typeIconClass = (type) => {
    switch (type) {
      case "student":
        return "bg-blue-100 text-blue-700";
      case "topup":
        return "bg-emerald-100 text-emerald-700";
      case "transaction":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  return /* @__PURE__ */ jsx("header", { className: "settings-enter relative z-40 border-b border-red-900 bg-gradient-to-r from-red-950 via-red-950 to-red-900 px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/10", children: logoUrl ? /* @__PURE__ */ jsx(
        "img",
        {
          src: logoUrl,
          alt: "School logo",
          className: "h-full w-full object-cover"
        }
      ) : /* @__PURE__ */ jsxs("svg", { className: "h-12 w-12", fill: "white", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
        /* @__PURE__ */ jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
        /* @__PURE__ */ jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
        /* @__PURE__ */ jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold text-white", children: canteenName }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-100", children: schoolName })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-white", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          displayName,
          " (",
          role === "admin" ? "Administrator" : role,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-red-100", children: [
        /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: currentTime })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setShowNotif((value) => !value);
              if (!showNotif) {
                void markAllRead();
              }
            },
            className: "relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20",
            children: [
              /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4" }),
              unreadCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-red-900", children: unreadCount > 9 ? "9+" : unreadCount })
            ]
          }
        ),
        showNotif && /* @__PURE__ */ jsxs("div", { className: "settings-enter absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[22rem] max-w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-gray-100 px-4 py-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 text-sm", children: "Notifications" }),
            notifications.length > 0 && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => void markAllRead(),
                className: "text-xs text-red-900 hover:underline font-medium",
                children: "Mark all read"
              }
            )
          ] }),
          notificationError && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsx("p", { children: notificationError })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto divide-y divide-gray-50", children: notifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center px-6 py-10 text-center text-gray-400", children: [
            /* @__PURE__ */ jsx(Bell, { className: "mb-2 h-8 w-8 opacity-30" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No notifications yet" })
          ] }) : notifications.map((notification) => /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => void markOneRead(notification.id),
              className: `flex cursor-pointer gap-3 px-4 py-3 transition-all duration-300 hover:bg-red-50/40 ${!notification.read ? "bg-red-50" : ""}`,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${typeIconClass(notification.type)}`,
                    children: typeIcon(notification.type)
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600", children: typeLabel(notification.type) }) }),
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className: `mt-1 text-sm leading-tight text-gray-900 ${!notification.read ? "font-semibold" : "font-medium"}`,
                          children: notification.title
                        }
                      )
                    ] }),
                    !notification.read && /* @__PURE__ */ jsx("span", { className: "shrink-0 h-2 w-2 rounded-full bg-red-500 mt-1" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-0.5 line-clamp-2", children: notification.message }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 mt-1", children: formatTime(notification.timestamp) })
                ] })
              ]
            },
            notification.id
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onLogout,
          className: "flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-2 text-sm font-semibold text-red-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md",
          children: [
            /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { children: "Logout" })
          ]
        }
      )
    ] })
  ] }) });
}
function MiniCalendar({ selectedDate, onDateChange }) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-surface px-4 py-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handlePrevMonth,
          className: "admin-interactive rounded-lg p-1 text-gray-600 hover:bg-red-50 hover:text-red-950",
          children: "←"
        }
      ),
      /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-gray-800 text-sm", children: [
        monthNames[currentMonth.getMonth()],
        " ",
        currentMonth.getFullYear()
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleNextMonth,
          className: "admin-interactive rounded-lg p-1 text-gray-600 hover:bg-red-50 hover:text-red-950",
          children: "→"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500", children: [
      /* @__PURE__ */ jsx("div", { children: "Su" }),
      /* @__PURE__ */ jsx("div", { children: "Mo" }),
      /* @__PURE__ */ jsx("div", { children: "Tu" }),
      /* @__PURE__ */ jsx("div", { children: "We" }),
      /* @__PURE__ */ jsx("div", { children: "Th" }),
      /* @__PURE__ */ jsx("div", { children: "Fr" }),
      /* @__PURE__ */ jsx("div", { children: "Sa" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-7 gap-1 text-sm", children: [
      [...Array(firstDayOfMonth)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "p-2" }, `empty-${i}`)),
      [...Array(daysInMonth)].map((_, i) => {
        const dayNumber = i + 1;
        const dateOfThisButton = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          dayNumber
        );
        const isSelected = isSameDay(dateOfThisButton, selectedDate);
        const today = /* @__PURE__ */ new Date();
        const todayNormalized = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const isToday = isSameDay(dateOfThisButton, todayNormalized);
        return /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onDateChange(dateOfThisButton),
            className: `flex w-full items-center justify-center rounded-xl p-1.5 text-sm transition-all duration-300 ${isSelected ? "bg-red-950 text-white font-medium shadow-md" : isToday ? "bg-red-50 font-semibold text-red-950 hover:-translate-y-0.5 hover:bg-red-100" : "text-gray-700 hover:-translate-y-0.5 hover:bg-gray-100"}`,
            children: dayNumber
          },
          dayNumber
        );
      })
    ] })
  ] });
}
function getDefaultNotificationTitle(targetType, action) {
  switch (targetType) {
    case "topup":
      return `Top-up ${action}`;
    case "transaction":
      return `Transaction ${action}`;
    default:
      return `Account ${action}`;
  }
}
const writeAccountAuditLog = async ({
  action,
  targetType,
  targetId,
  targetName,
  details,
  notificationTitle,
  notificationMessage,
  notificationType = "general",
  notifyAdmin = true
}) => {
  const actor = auth.currentUser;
  const actorLabel = (actor == null ? void 0 : actor.displayName) || (actor == null ? void 0 : actor.email) || "Unknown user";
  const timestamp = Date.now();
  await addDoc(collection(db, "audit_logs"), {
    action,
    targetType,
    targetId,
    targetName,
    details,
    actorId: (actor == null ? void 0 : actor.uid) ?? null,
    actorLabel,
    timestamp
  });
  if (!notifyAdmin) {
    return;
  }
  try {
    await addDoc(collection(db, "notifications"), {
      title: notificationTitle ?? getDefaultNotificationTitle(targetType, action),
      message: notificationMessage ?? `${targetName}: ${String(details)}`,
      timestamp,
      read: false,
      type: notificationType,
      target: "admin",
      targetId,
      targetType,
      actorId: (actor == null ? void 0 : actor.uid) ?? null,
      actorLabel
    });
  } catch (error) {
    if ((error == null ? void 0 : error.code) !== "permission-denied") {
      throw error;
    }
  }
};
const VARIANT_STYLES = {
  info: {
    badge: "System Notice",
    badgeClass: "bg-red-100 text-red-900",
    confirmClass: "bg-red-950 text-white hover:bg-red-900"
  },
  success: {
    badge: "Success",
    badgeClass: "bg-emerald-100 text-emerald-800",
    confirmClass: "bg-emerald-600 text-white hover:bg-emerald-700"
  },
  danger: {
    badge: "Confirm Action",
    badgeClass: "bg-red-100 text-red-800",
    confirmClass: "bg-red-700 text-white hover:bg-red-800"
  }
};
function SystemDialog({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  variant = "info"
}) {
  if (!isOpen) return null;
  const styles = VARIANT_STYLES[variant];
  return /* @__PURE__ */ jsx(AdminModalPortal, { children: /* @__PURE__ */ jsx("div", { className: "admin-dialog-backdrop", children: /* @__PURE__ */ jsxs("div", { className: "admin-modal-panel max-w-md overflow-hidden rounded-3xl border border-red-100 bg-white shadow-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-red-950 via-red-900 to-red-800 px-6 py-5 text-white", children: [
      /* @__PURE__ */ jsx(
        "span",
        {
          className: `inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${styles.badgeClass}`,
          children: styles.badge
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 text-xl font-semibold tracking-tight", children: title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-6 py-5", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-6 text-gray-600", children: message }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", children: [
        onConfirm ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50",
            children: cancelLabel
          }
        ) : null,
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onConfirm ?? onClose,
            className: `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles.confirmClass}`,
            children: confirmLabel
          }
        )
      ] })
    ] })
  ] }) }) });
}
function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transactionsEnabled, setTransactionsEnabled] = useState(true);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "OK"
  });
  useEffect(() => {
    const requestsQuery = query(
      collection(db, "topup_requests"),
      where("status", "==", "pending")
    );
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const pendingData = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
      }));
      setRequests(pendingData.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const settingsRef = doc(db, "settings", "transaction_control");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      setTransactionsEnabled(snapshot.exists() ? snapshot.data().enabled !== false : true);
    });
    return () => unsubscribe();
  }, []);
  const closeDialog = () => setDialog((current) => ({
    ...current,
    isOpen: false,
    onConfirm: void 0
  }));
  const showNotice = (title, message, variant = "info") => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant,
      confirmLabel: "Got it"
    });
  };
  const showConfirm = (title, message, onConfirm, confirmLabel = "Continue") => {
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
      }
    });
  };
  const handleApprove = async (request) => {
    if (!transactionsEnabled) {
      showNotice("Transactions Paused", "Transactions are currently disabled in Settings.");
      return;
    }
    showConfirm(
      "Approve Top-Up",
      `Approve PHP ${request.amount.toFixed(2)} top-up for ${request.studentName}?`,
      () => {
        void processApprove(request);
      },
      "Approve"
    );
  };
  const processApprove = async (request) => {
    setLoading(true);
    try {
      const actor = auth.currentUser;
      const processedAt = Date.now();
      const settingsRef = doc(db, "settings", "transaction_control");
      const requestRef = doc(db, "topup_requests", request.id);
      const studentRef = doc(db, "students", request.studentId);
      let previousBalance = 0;
      let newBalance = 0;
      await runTransaction(db, async (transaction) => {
        const settingsSnap = await transaction.get(settingsRef);
        const requestSnap = await transaction.get(requestRef);
        const studentSnap = await transaction.get(studentRef);
        const settingsAreEnabled = settingsSnap.exists() ? settingsSnap.data().enabled !== false : true;
        if (!settingsAreEnabled) {
          throw new Error("Transactions are currently disabled in Settings.");
        }
        if (!requestSnap.exists()) {
          throw new Error("Top-up request no longer exists.");
        }
        if (!studentSnap.exists()) {
          throw new Error("Student record not found.");
        }
        if (requestSnap.data().status !== "pending") {
          throw new Error("This top-up request has already been processed.");
        }
        previousBalance = Number(studentSnap.data().balance ?? 0);
        newBalance = previousBalance + request.amount;
        transaction.update(studentRef, { balance: newBalance });
        transaction.update(requestRef, {
          status: "approved",
          processedAt,
          processedById: (actor == null ? void 0 : actor.uid) ?? null,
          processedByLabel: (actor == null ? void 0 : actor.displayName) || (actor == null ? void 0 : actor.email) || "Unknown user"
        });
      });
      await writeAccountAuditLog({
        action: "approved",
        targetType: "topup",
        targetId: request.id,
        targetName: `Top-up for ${request.studentName}`,
        details: {
          source: "admin panel",
          studentId: request.studentId,
          studentName: request.studentName,
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          referenceNo: request.referenceNo,
          previousBalance,
          newBalance
        },
        notificationTitle: "Top-up approved",
        notificationMessage: `Approved PHP ${request.amount.toFixed(2)} for ${request.studentName}.`
      });
      showNotice(
        "Top-Up Approved",
        `Successfully added PHP ${request.amount.toFixed(2)} to ${request.studentName}'s wallet.`,
        "success"
      );
    } catch (error) {
      showNotice(
        "Approval Failed",
        (error == null ? void 0 : error.message) || "Failed to approve transaction.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleReject = async (request) => {
    if (!transactionsEnabled) {
      showNotice("Transactions Paused", "Transactions are currently disabled in Settings.");
      return;
    }
    showConfirm(
      "Reject Top-Up",
      "Are you sure you want to reject this top-up?",
      () => {
        void processReject(request);
      },
      "Reject"
    );
  };
  const processReject = async (request) => {
    setLoading(true);
    try {
      const actor = auth.currentUser;
      await updateDoc(doc(db, "topup_requests", request.id), {
        status: "rejected",
        processedAt: Date.now(),
        processedById: (actor == null ? void 0 : actor.uid) ?? null,
        processedByLabel: (actor == null ? void 0 : actor.displayName) || (actor == null ? void 0 : actor.email) || "Unknown user"
      });
      await writeAccountAuditLog({
        action: "rejected",
        targetType: "topup",
        targetId: request.id,
        targetName: `Top-up for ${request.studentName}`,
        details: {
          source: "admin panel",
          studentId: request.studentId,
          studentName: request.studentName,
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          referenceNo: request.referenceNo,
          status: "rejected"
        },
        notificationTitle: "Top-up rejected",
        notificationMessage: `Rejected PHP ${request.amount.toFixed(2)} for ${request.studentName}.`
      });
      showNotice(
        "Top-Up Rejected",
        `Rejected PHP ${request.amount.toFixed(2)} top-up for ${request.studentName}.`,
        "success"
      );
    } catch (error) {
      showNotice(
        "Rejection Failed",
        (error == null ? void 0 : error.message) || "Failed to reject the top-up request.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "settings-enter settings-delay-2 admin-surface p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-2 text-xl font-semibold text-gray-900", children: "Pending Top-Up Approvals" }),
      /* @__PURE__ */ jsx("p", { className: "mb-5 text-sm text-gray-500", children: "Review wallet funding requests and act without leaving the queue." }),
      !transactionsEnabled && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800", children: "Transaction approvals are disabled from Settings. Enable transactions to approve or reject requests." }),
      requests.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-400", children: "No pending requests at the moment." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: requests.map((req) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "admin-interactive flex flex-col items-center justify-between rounded-3xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4 sm:mb-0", children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: req.studentName }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
                /* @__PURE__ */ jsxs("span", { className: "font-medium text-blue-600", children: [
                  "PHP ",
                  req.amount.toFixed(2)
                ] }),
                " ",
                "via ",
                req.paymentMethod
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "border-r border-blue-200 pr-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700", children: "Ref" }),
                /* @__PURE__ */ jsx("span", { className: "font-mono text-base font-bold tracking-[0.08em] text-gray-800 sm:text-lg", children: req.referenceNo })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleReject(req),
                  disabled: loading || !transactionsEnabled,
                  className: "flex items-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-50 disabled:opacity-50 disabled:hover:translate-y-0",
                  children: [
                    /* @__PURE__ */ jsx(X, { className: "mr-1 h-4 w-4" }),
                    " Reject"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleApprove(req),
                  disabled: loading || !transactionsEnabled,
                  className: "flex items-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
                  children: [
                    /* @__PURE__ */ jsx(Check, { className: "mr-1 h-4 w-4" }),
                    " Verify & Approve"
                  ]
                }
              )
            ] })
          ]
        },
        req.id
      )) })
    ] }),
    /* @__PURE__ */ jsx(
      SystemDialog,
      {
        isOpen: dialog.isOpen,
        title: dialog.title,
        message: dialog.message,
        variant: dialog.variant,
        confirmLabel: dialog.confirmLabel,
        cancelLabel: dialog.cancelLabel,
        onClose: closeDialog,
        onConfirm: dialog.onConfirm
      }
    )
  ] });
}
const ARCHIVES_COLLECTION = "archives";
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1e3;
async function archiveDocument(collectionName, docId) {
  const normalizedCollection = collectionName.trim();
  const normalizedDocId = docId.trim();
  if (!normalizedCollection) {
    throw new Error("A valid collection name is required.");
  }
  if (!normalizedDocId) {
    throw new Error("A valid document ID is required.");
  }
  if (normalizedCollection === ARCHIVES_COLLECTION) {
    throw new Error("Cannot archive a document that is already in archives.");
  }
  const sourceRef = doc(db, normalizedCollection, normalizedDocId);
  const archiveRef = doc(db, ARCHIVES_COLLECTION, normalizedDocId);
  const sourceSnapshot = await getDoc(sourceRef);
  if (!sourceSnapshot.exists()) {
    throw new Error("Document not found in source collection.");
  }
  const sourceData = sourceSnapshot.data();
  const archiveSnapshot = await getDoc(archiveRef);
  if (archiveSnapshot.exists()) {
    throw new Error("An archived document with this ID already exists.");
  }
  await setDoc(archiveRef, {
    ...sourceData,
    uid: typeof sourceData.uid === "string" && sourceData.uid.trim().length > 0 ? sourceData.uid : normalizedDocId,
    originalCollection: normalizedCollection,
    originalDocId: normalizedDocId,
    archivedAt: serverTimestamp(),
    deleteAt: new Date(Date.now() + THIRTY_DAYS_IN_MS)
  });
  await deleteDoc(sourceRef);
}
async function restoreDocument(docId) {
  const normalizedDocId = docId.trim();
  if (!normalizedDocId) {
    throw new Error("A valid document ID is required.");
  }
  const archiveRef = doc(db, ARCHIVES_COLLECTION, normalizedDocId);
  const archivedSnapshot = await getDoc(archiveRef);
  if (!archivedSnapshot.exists()) {
    throw new Error("Archived document not found.");
  }
  const archiveData = archivedSnapshot.data();
  const originalCollection = archiveData.originalCollection;
  const originalDocId = typeof archiveData.originalDocId === "string" && archiveData.originalDocId.trim().length > 0 ? archiveData.originalDocId : normalizedDocId;
  if (typeof originalCollection !== "string" || !originalCollection.trim()) {
    throw new Error("Archived document is missing originalCollection metadata.");
  }
  const {
    archivedAt: _archivedAt,
    deleteAt: _deleteAt,
    originalCollection: _originalCollection,
    originalDocId: _originalDocId,
    ...restoredData
  } = archiveData;
  await setDoc(doc(db, originalCollection, originalDocId), {
    ...restoredData,
    uid: typeof restoredData.uid === "string" && restoredData.uid.trim().length > 0 ? restoredData.uid : originalDocId
  });
  await deleteDoc(archiveRef);
}
async function deleteArchivedDocument(docId) {
  const normalizedDocId = docId.trim();
  if (!normalizedDocId) {
    throw new Error("A valid document ID is required.");
  }
  await deleteDoc(doc(db, ARCHIVES_COLLECTION, normalizedDocId));
}
function AdminPrimaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button"
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type,
      onClick,
      disabled,
      className: `inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-950 px-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${className}`,
      children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 shrink-0" }),
        /* @__PURE__ */ jsx("span", { children })
      ]
    }
  );
}
function StaffPage() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    password: ""
  });
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "OK"
  });
  const closeDialog = () => setDialog((current) => ({
    ...current,
    isOpen: false,
    onConfirm: void 0
  }));
  const showNotice = (title, message, variant = "info") => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant,
      confirmLabel: "Got it"
    });
  };
  const showConfirm = (title, message, onConfirm, confirmLabel = "Continue") => {
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
      }
    });
  };
  const filteredStaffMembers = staffMembers.filter(
    (staff) => {
      var _a, _b, _c, _d;
      return ((_a = staff.displayName) == null ? void 0 : _a.toLowerCase().includes(search.toLowerCase())) || ((_b = staff.email) == null ? void 0 : _b.toLowerCase().includes(search.toLowerCase())) || ((_c = staff.phone) == null ? void 0 : _c.toLowerCase().includes(search.toLowerCase())) || ((_d = staff.joined) == null ? void 0 : _d.toLowerCase().includes(search.toLowerCase()));
    }
  );
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, "users"), where("role", "in", ["staff", "Staff"]));
      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }));
          setStaffMembers(data);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error("StaffPage query failed:", err.message);
          setError(err.message);
          setLoading(false);
        }
      );
      return () => unsubscribeSnapshot();
    });
    return () => unsubscribeAuth();
  }, []);
  const handleAddStaff = async () => {
    if (!formData.displayName || !formData.email || !formData.phone || !formData.password) {
      showNotice("Incomplete Form", "Please fill in all fields.", "danger");
      return;
    }
    try {
      const secondaryApp = getApps().find((app2) => app2.name === "secondary") || initializeApp(firebaseConfig, "secondary");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      const uid = userCredential.user.uid;
      await secondaryAuth.signOut();
      await setDoc(doc(db, "users", uid), {
        uid,
        displayName: formData.displayName,
        role: "staff",
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        joined: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      });
      showNotice("Staff Added", "The staff member was added successfully.", "success");
      setShowModal(false);
      setEditingStaffId(null);
      setFormData({ displayName: "", email: "", phone: "", password: "" });
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        showNotice("Email Already Registered", "This email is already registered.", "danger");
      } else {
        showNotice("Add Staff Failed", "Failed to add staff: " + err.message, "danger");
      }
    }
  };
  const handleEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setFormData({
      displayName: staff.displayName ?? "",
      email: staff.email ?? "",
      phone: staff.phone ?? "",
      password: ""
    });
    setShowModal(true);
  };
  const handleUpdateStaff = async () => {
    if (!editingStaffId) return;
    if (!formData.displayName || !formData.email || !formData.phone) {
      showNotice("Incomplete Form", "Please fill in all required fields.", "danger");
      return;
    }
    try {
      await updateDoc(doc(db, "users", editingStaffId), {
        displayName: formData.displayName,
        phone: formData.phone
      });
      showNotice("Staff Updated", "The staff member details were updated.", "success");
      closeModal();
    } catch (err) {
      showNotice("Update Staff Failed", "Failed to update staff details: " + err.message, "danger");
    }
  };
  const handleDeleteStaff = async (id) => {
    showConfirm(
      "Remove Staff Member",
      "Are you sure you want to archive this staff member?",
      () => {
        void (async () => {
          try {
            await archiveDocument("users", id);
            showNotice(
              "Staff Archived",
              "Staff member was archived and can be restored from System Archive.",
              "success"
            );
          } catch (err) {
            showNotice(
              "Archive Failed",
              "Failed to archive staff member: " + err.message,
              "danger"
            );
          }
        })();
      },
      "Remove"
    );
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingStaffId(null);
    setFormData({ displayName: "", email: "", phone: "", password: "" });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500", children: "Loading staff..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-8 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-red-500 font-medium", children: "Failed to load staff" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-1", children: error }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400 mt-2", children: [
        "Make sure your Firestore rules are published and your account has the",
        " ",
        /* @__PURE__ */ jsx("strong", { children: "admin" }),
        " role."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-2", children: "Staff Management" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Manage your staff members, roles, and permissions." })
        ] }),
        /* @__PURE__ */ jsx(AdminPrimaryButton, { onClick: () => setShowModal(true), children: "Add Staff" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative mb-6 max-w-sm", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search by name, email, phone...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          }
        ),
        search && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSearch(""),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Name" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Role" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Contact" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Joined" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: filteredStaffMembers.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "text-center py-8 text-gray-400", children: search ? `No staff members found for "${search}".` : "No staff members found." }) }) : filteredStaffMembers.map((staff) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-gray-600" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900", children: staff.displayName }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: staff.email })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize", children: "Staff" }) }),
          /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4" }),
            staff.phone || "—"
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: staff.joined || "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleEditStaff(staff),
                className: "inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100",
                children: [
                  /* @__PURE__ */ jsx(Edit2, { className: "h-3.5 w-3.5" }),
                  "Edit"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleDeleteStaff(staff.id),
                className: "px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                children: "Remove"
              }
            )
          ] }) })
        ] }, staff.id)) })
      ] }) })
    ] }),
    showModal && /* @__PURE__ */ jsx(AdminModalPortal, { children: /* @__PURE__ */ jsx("div", { className: "admin-modal-backdrop", children: /* @__PURE__ */ jsxs("div", { className: "admin-modal-panel relative max-w-md rounded-lg bg-white p-6 shadow-lg", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: closeModal,
          className: "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100",
          children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: editingStaffId ? "Edit Staff Member" : "Add New Staff Member" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: editingStaffId ? "Update the staff profile details below" : "Fill in the details below" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Full Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formData.displayName,
              onChange: (e) => setFormData({ ...formData, displayName: e.target.value }),
              placeholder: "Enter full name",
              className: "w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Role" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: "Staff",
              disabled: true,
              className: "w-full rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-gray-500 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: formData.email,
              onChange: (e) => setFormData({ ...formData, email: e.target.value }),
              readOnly: Boolean(editingStaffId),
              placeholder: "email@example.com",
              className: `w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${editingStaffId ? "border-gray-200 bg-gray-50 text-gray-500" : "border-gray-300"}`
            }
          ),
          editingStaffId && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Email is read-only here to avoid breaking staff sign-in." })
        ] }),
        !editingStaffId && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: formData.password,
              onChange: (e) => setFormData({ ...formData, password: e.target.value }),
              placeholder: "Set initial password",
              className: "w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Phone Number" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              value: formData.phone,
              onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
              placeholder: "+63 XXX XXX XXXX",
              className: "w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: closeModal,
            className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: editingStaffId ? handleUpdateStaff : handleAddStaff,
            className: "flex-1 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors",
            children: editingStaffId ? "Save Changes" : "Add Staff"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(
      SystemDialog,
      {
        isOpen: dialog.isOpen,
        title: dialog.title,
        message: dialog.message,
        variant: dialog.variant,
        confirmLabel: dialog.confirmLabel,
        cancelLabel: dialog.cancelLabel,
        onClose: closeDialog,
        onConfirm: dialog.onConfirm
      }
    )
  ] });
}
const LOW_STOCK_THRESHOLD = 5;
const getProductStockLevel = (stockQuantity) => {
  if (stockQuantity <= 0) return "out";
  if (stockQuantity <= LOW_STOCK_THRESHOLD) return "low";
  return "high";
};
const normalizeProduct = (id, data) => ({
  id,
  name: String(data.name ?? ""),
  price: Number(data.price ?? 0),
  category: String(data.category ?? ""),
  imageUrl: String(data.imageUrl ?? ""),
  stockQuantity: Math.max(0, Number(data.stockQuantity ?? 0)),
  isAvailable: data.isAvailable !== false,
  createdAt: typeof data.createdAt === "number" ? data.createdAt : void 0
});
const subscribeToProducts = (callback) => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(
        (snapshotDoc) => normalizeProduct(snapshotDoc.id, snapshotDoc.data())
      );
      callback(data);
    },
    (error) => {
      console.error("Error subscribing to products:", error);
      callback([]);
    }
  );
};
const addProduct = async (product) => {
  return await addDoc(collection(db, "products"), {
    ...product,
    stockQuantity: Math.max(0, product.stockQuantity ?? 0),
    isAvailable: product.isAvailable ?? true,
    createdAt: Date.now()
  });
};
const updateProduct = async (id, product) => {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, {
    ...product,
    stockQuantity: Math.max(0, product.stockQuantity ?? 0),
    isAvailable: product.isAvailable ?? true
  });
};
const CLOUDINARY_CLOUD_NAME$2 = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET$2 = "edutap_student_photos";
function ProductsInventory() {
  var _a;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageMode, setImageMode] = useState("url");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState(null);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "OK"
  });
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stockQuantity: "",
    imageUrl: "",
    isAvailable: true
  });
  const closeDialog = () => setDialog((current) => ({
    ...current,
    isOpen: false,
    onConfirm: void 0
  }));
  const showNotice = (title, message, variant = "info") => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant,
      confirmLabel: "Got it"
    });
  };
  const showConfirm = (title, message, onConfirm, confirmLabel = "Continue") => {
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
      }
    });
  };
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(
        snapshot.docs.map((categoryDoc) => String(categoryDoc.data().name ?? "").trim()).filter(Boolean)
      );
    });
    return unsubscribe;
  }, []);
  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const availableCategories = formData.category && !categories.includes(formData.category) ? [...categories, formData.category] : categories;
  const outOfStockProducts = products.filter((product) => product.stockQuantity <= 0);
  const lowStockProducts = products.filter(
    (product) => product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD
  );
  const highStockProducts = products.filter(
    (product) => getProductStockLevel(product.stockQuantity) === "high"
  );
  const uploadToCloudinary = async (file) => {
    const formData2 = new FormData();
    formData2.append("file", file);
    formData2.append("upload_preset", CLOUDINARY_UPLOAD_PRESET$2);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME$2}/image/upload`,
      { method: "POST", body: formData2 }
    );
    if (!response.ok) {
      throw new Error("Failed to upload image to Cloudinary");
    }
    return (await response.json()).secure_url;
  };
  const handleImageFileChange = (event) => {
    var _a2;
    const file = (_a2 = event.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData((current) => ({ ...current, imageUrl: "" }));
  };
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((current) => ({ ...current, imageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      stockQuantity: "",
      imageUrl: "",
      isAvailable: true
    });
    setImageMode("url");
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };
  const handleEditClick = (product) => {
    var _a2;
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable ?? true
    });
    const isUrl = (_a2 = product.imageUrl) == null ? void 0 : _a2.startsWith("http");
    setImageMode("url");
    setImageFile(null);
    setImagePreview(isUrl ? product.imageUrl : null);
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    showConfirm(
      "Archive Product",
      "Are you sure you want to archive this product?",
      () => {
        void (async () => {
          try {
            setSaving(true);
            await archiveDocument("products", id);
            showNotice(
              "Product Archived",
              "Product was archived and can be restored from System Archive.",
              "success"
            );
          } catch (error) {
            showNotice("Archive Failed", "Error archiving product: " + error, "danger");
          } finally {
            setSaving(false);
          }
        })();
      },
      "Archive"
    );
  };
  const handleToggleAvailability = async (product) => {
    const nextValue = !(product.isAvailable ?? true);
    const previousProducts = products;
    try {
      setTogglingProductId(product.id);
      setProducts(
        (current) => current.map(
          (currentProduct) => currentProduct.id === product.id ? { ...currentProduct, isAvailable: nextValue } : currentProduct
        )
      );
      await updateProduct(product.id, {
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        isAvailable: nextValue
      });
      showNotice(
        "Product Availability Updated",
        `${product.name} is now ${nextValue ? "available" : "unavailable"} in POS.`,
        "success"
      );
    } catch (error) {
      setProducts(previousProducts);
      showNotice(
        "Availability Update Failed",
        "Unable to update product availability: " + error,
        "danger"
      );
    } finally {
      setTogglingProductId(null);
    }
  };
  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category || !formData.stockQuantity) {
      showNotice("Incomplete Form", "Please fill in all fields.", "danger");
      return;
    }
    const parsedStockQuantity = Number(formData.stockQuantity);
    if (!Number.isFinite(parsedStockQuantity) || parsedStockQuantity < 0) {
      showNotice("Invalid Stock Quantity", "Stock quantity cannot be negative.", "danger");
      return;
    }
    if (imageMode === "url" && !formData.imageUrl) {
      showNotice("Missing Image", "Please enter an image label or URL.", "danger");
      return;
    }
    if (imageMode === "upload" && !imageFile && !imagePreview) {
      showNotice("Missing Image", "Please upload an image.", "danger");
      return;
    }
    try {
      setSaving(true);
      let finalImageUrl = formData.imageUrl;
      if (imageMode === "upload" && imageFile) {
        setUploading(true);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setUploading(false);
      }
      if (editingId) {
        await updateProduct(editingId, {
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          imageUrl: finalImageUrl,
          stockQuantity: parsedStockQuantity,
          isAvailable: formData.isAvailable
        });
        showNotice("Product Updated", "Product updated successfully!", "success");
      } else {
        await addProduct({
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          imageUrl: finalImageUrl,
          stockQuantity: parsedStockQuantity,
          isAvailable: formData.isAvailable
        });
        showNotice("Product Added", "Product added successfully!", "success");
      }
      setShowForm(false);
      setFormData({
        name: "",
        category: "",
        price: "",
        stockQuantity: "",
        imageUrl: "",
        isAvailable: true
      });
      clearImage();
    } catch (error) {
      showNotice("Save Failed", "Error saving product: " + error, "danger");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "settings-enter settings-delay-2 admin-surface overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Products Inventory" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Manage product details, visibility, and category alignment." })
        ] }),
        /* @__PURE__ */ jsx(AdminPrimaryButton, { onClick: handleAddClick, disabled: loading || saving, children: "Add Product" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-6", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex h-48 items-center justify-center text-gray-500", children: [
        /* @__PURE__ */ jsx(Loader, { className: "h-6 w-6 animate-spin mr-2" }),
        "Loading products..."
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search by product name or category...",
              value: searchQuery,
              onChange: (event) => setSearchQuery(event.target.value),
              className: "w-full rounded-xl border border-gray-300 py-3 pl-10 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
            }
          ),
          searchQuery && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSearchQuery(""),
              className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg",
              children: "x"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4 text-sm", children: searchQuery ? `${filteredProducts.length} result(s) for "${searchQuery}"` : `Total Products: ${products.length}` }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6 grid gap-3 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-emerald-800", children: [
              /* @__PURE__ */ jsx(Box, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "High Stock" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-bold text-emerald-900", children: highStockProducts.length }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-emerald-700", children: [
              "More than ",
              LOW_STOCK_THRESHOLD,
              " units available."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-800", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Low Stock" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-bold text-amber-900", children: lowStockProducts.length }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-amber-700", children: [
              "At or below ",
              LOW_STOCK_THRESHOLD,
              " units."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-red-800", children: [
              /* @__PURE__ */ jsx(PackageX, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "No Stock" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-bold text-red-900", children: outOfStockProducts.length }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-700", children: "These items should stay blocked in POS." })
          ] })
        ] }),
        (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-3", children: [
          outOfStockProducts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Out-of-stock alert" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1", children: outOfStockProducts.map((product) => product.name).join(", ") })
          ] }),
          lowStockProducts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Low-stock alert" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1", children: lowStockProducts.map(
              (product) => `${product.name} (${product.stockQuantity})`
            ).join(", ") })
          ] })
        ] }),
        filteredProducts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex h-32 items-center justify-center text-gray-400 text-sm", children: searchQuery ? `No products found for "${searchQuery}"` : "No products yet." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Image" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Product Name" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Category" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Price" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Quantity" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Stock Status" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Availability" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: filteredProducts.map((product) => {
            var _a2;
            const stockLevel = getProductStockLevel(
              product.stockQuantity
            );
            const stockBadgeClass = stockLevel === "high" ? "bg-emerald-100 text-emerald-700" : stockLevel === "low" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
            const stockLabel = stockLevel === "high" ? "High Stock" : stockLevel === "low" ? "Low Stock" : "No Stock";
            return /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "border-b border-gray-100 transition-colors duration-300 hover:bg-red-50/40",
                children: [
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: ((_a2 = product.imageUrl) == null ? void 0 : _a2.startsWith("http")) ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: product.imageUrl,
                      alt: product.name,
                      className: "w-10 h-10 rounded-lg object-cover border border-gray-200"
                    }
                  ) : /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700", children: product.imageUrl }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm font-medium", children: product.name }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm", children: product.category }),
                  /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-sm", children: [
                    "PHP ",
                    product.price.toFixed(2)
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm font-semibold text-gray-800", children: product.stockQuantity }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockBadgeClass}`,
                      children: stockLabel
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => void handleToggleAvailability(
                        product
                      ),
                      disabled: togglingProductId === product.id,
                      className: `inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 disabled:opacity-50 ${product.isAvailable ?? true ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`,
                      children: [
                        togglingProductId === product.id && /* @__PURE__ */ jsx(Loader, { className: "h-3 w-3 animate-spin" }),
                        product.isAvailable ?? true ? "Available" : "Unavailable"
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleEditClick(product),
                        disabled: saving,
                        className: "flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 disabled:opacity-50 disabled:hover:translate-y-0",
                        children: [
                          /* @__PURE__ */ jsx(Edit2, { className: "w-3 h-3" }),
                          " Edit"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleDelete(product.id),
                        disabled: saving,
                        className: "flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-200 disabled:opacity-50 disabled:hover:translate-y-0",
                        children: [
                          /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" }),
                          " ",
                          "Archive"
                        ]
                      }
                    )
                  ] }) })
                ]
              },
              product.id
            );
          }) })
        ] }) })
      ] }) }),
      showForm && /* @__PURE__ */ jsx(AdminModalPortal, { children: /* @__PURE__ */ jsx("div", { className: "admin-modal-backdrop", children: /* @__PURE__ */ jsxs("div", { className: "admin-modal-panel settings-enter max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold", children: editingId ? "Edit Product" : "Add New Product" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowForm(false),
              disabled: saving,
              className: "rounded-xl p-1 text-gray-400 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50",
              children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Product Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "e.g., Rice Meal w/ Fried Egg",
                value: formData.name,
                onChange: (event) => setFormData({ ...formData, name: event.target.value }),
                disabled: saving,
                className: "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Price (PHP) *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                placeholder: "e.g., 65.00",
                value: formData.price,
                onChange: (event) => setFormData({ ...formData, price: event.target.value }),
                disabled: saving,
                className: "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Stock Quantity *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                placeholder: "e.g., 20",
                value: formData.stockQuantity,
                onChange: (event) => setFormData({
                  ...formData,
                  stockQuantity: event.target.value
                }),
                disabled: saving,
                className: "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "0 means the item is out of stock and should not be sold in POS." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Category *" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: formData.category,
                onChange: (event) => setFormData({
                  ...formData,
                  category: event.target.value
                }),
                disabled: saving,
                className: "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select a category..." }),
                  availableCategories.map((category) => /* @__PURE__ */ jsx("option", { value: category, children: category }, category))
                ]
              }
            ),
            availableCategories.length === 0 && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-amber-700", children: "Add categories in Settings before creating products." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-2", children: "POS Availability" }),
            /* @__PURE__ */ jsxs("div", { className: "flex overflow-hidden rounded-2xl border border-gray-300", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setFormData((current) => ({
                    ...current,
                    isAvailable: true
                  })),
                  className: `flex-1 py-2.5 text-sm font-medium transition-all duration-300 ${formData.isAvailable ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                  children: "Available"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setFormData((current) => ({
                    ...current,
                    isAvailable: false
                  })),
                  className: `flex-1 py-2.5 text-sm font-medium transition-all duration-300 ${!formData.isAvailable ? "bg-gray-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                  children: "Unavailable"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Controls whether this product can be used in POS." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-2", children: "Product Image *" }),
            /* @__PURE__ */ jsxs("div", { className: "mb-3 flex overflow-hidden rounded-2xl border border-gray-300", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setImageMode("url");
                    clearImage();
                  },
                  className: `flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-300 ${imageMode === "url" ? "bg-red-950 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                  children: [
                    /* @__PURE__ */ jsx(Link, { className: "w-4 h-4" }),
                    "URL / Label"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setImageMode("upload");
                    setFormData((current) => ({
                      ...current,
                      imageUrl: ""
                    }));
                  },
                  className: `flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-300 ${imageMode === "upload" ? "bg-red-950 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                  children: [
                    /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                    "Upload Image"
                  ]
                }
              )
            ] }),
            imageMode === "url" && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "e.g., Burger or https://res.cloudinary.com/...",
                  value: formData.imageUrl,
                  onChange: (event) => setFormData({
                    ...formData,
                    imageUrl: event.target.value
                  }),
                  disabled: saving,
                  className: "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Use a short label or paste a Cloudinary/image URL." }),
              ((_a = formData.imageUrl) == null ? void 0 : _a.startsWith("http")) && /* @__PURE__ */ jsx(
                "img",
                {
                  src: formData.imageUrl,
                  alt: "preview",
                  className: "mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200",
                  onError: (event) => event.currentTarget.style.display = "none"
                }
              )
            ] }),
            imageMode === "upload" && /* @__PURE__ */ jsxs("div", { children: [
              imagePreview ? /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: imagePreview,
                    alt: "preview",
                    className: "w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: clearImage,
                    className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600",
                    children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
                  }
                )
              ] }) : /* @__PURE__ */ jsxs(
                "label",
                {
                  htmlFor: "product-image",
                  className: "flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/40",
                  children: [
                    /* @__PURE__ */ jsx(Upload, { className: "w-6 h-6 text-gray-400 mb-1" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Click to upload image" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: "PNG, JPG, WEBP" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: fileInputRef,
                  id: "product-image",
                  type: "file",
                  accept: "image/*",
                  onChange: handleImageFileChange,
                  className: "hidden"
                }
              ),
              imageFile && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
                imageFile.name,
                " - Will upload to Cloudinary on save"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowForm(false);
                clearImage();
              },
              disabled: saving,
              className: "flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 disabled:opacity-50 disabled:hover:translate-y-0",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSubmit,
              disabled: saving || uploading,
              className: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-950 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
              children: uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }),
                " Uploading..."
              ] }) : saving ? "Saving..." : editingId ? "Update Product" : "Add Product"
            }
          )
        ] })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(
      SystemDialog,
      {
        isOpen: dialog.isOpen,
        title: dialog.title,
        message: dialog.message,
        variant: dialog.variant,
        confirmLabel: dialog.confirmLabel,
        cancelLabel: dialog.cancelLabel,
        onClose: closeDialog,
        onConfirm: dialog.onConfirm
      }
    )
  ] });
}
function QuickActions({ currentPage, onNavigate }) {
  return /* @__PURE__ */ jsx("div", { className: "settings-enter settings-delay-4 mb-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("dashboard"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "dashboard" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(Home, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Dashboard" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("products"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "products" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Products" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("staff"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "staff" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Staff" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("users"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "users" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(UserPlus, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Users" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("topups"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "topups" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Manage Top-Ups" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("settings"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "settings" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Settings" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("systemArchive"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "systemArchive" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(Archive, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "System Archive" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onNavigate("logs"),
        className: `admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${currentPage === "logs" ? "border-red-200 bg-red-50 text-red-950 shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"}`,
        children: [
          /* @__PURE__ */ jsx(History, { className: "w-6 h-6 mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Logs" })
        ]
      }
    )
  ] }) });
}
const DEFAULT_BRANDING = {
  schoolName: "",
  canteenName: "",
  themeColor: "#7f1d1d",
  logoUrl: null,
  faviconUrl: null,
  loginBgType: "color",
  loginBgColor: "#ffffff",
  loginBgUrl: null
};
const CLOUDINARY_CLOUD_NAME$1 = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET$1 = "branding_edutap";
function getBrandingIconUrl(branding) {
  return branding.faviconUrl || branding.logoUrl;
}
function SectionCard({
  eyebrow,
  title,
  description,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: `overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md ${className ?? ""}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5 sm:px-7", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.22em] text-red-900/70", children: eyebrow }),
          /* @__PURE__ */ jsx("h3", { className: "mt-2 text-xl font-semibold text-gray-900", children: title }),
          description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: description })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-6 py-6 sm:px-7", children })
      ]
    }
  );
}
function SaveButton({
  saving,
  saved,
  onClick,
  label = "Save Changes"
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick,
      disabled: saving,
      className: "inline-flex items-center justify-center gap-2 rounded-xl bg-red-950 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
      children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { className: "inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" }),
        "Saving..."
      ] }) : saved ? "Saved!" : label
    }
  );
}
function FieldLabel({ label, helper }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-800", children: label }),
    helper && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: helper })
  ] });
}
function AssetTile({
  label,
  helper,
  preview,
  onClick,
  shape = "rectangle"
}) {
  const tileHeight = shape === "wide" ? "h-28" : shape === "square" ? "h-28" : "h-32";
  const imageClass = shape === "square" ? "h-16 w-16 object-contain" : shape === "wide" ? "h-full w-full object-cover" : "max-h-20 max-w-full object-contain";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx(FieldLabel, { label, helper }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick,
        className: `group flex ${tileHeight} w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-900/40 hover:bg-red-50/40 hover:shadow-sm`,
        children: preview ? /* @__PURE__ */ jsx(
          "img",
          {
            src: preview,
            alt: label,
            className: `${imageClass} transition-transform duration-500 group-hover:scale-[1.03]`
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "text-center transition-transform duration-300 group-hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Upload" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-400", children: "Click to choose a file" })
        ] })
      }
    )
  ] });
}
function BrandingPanel({
  branding,
  onChange,
  onSave,
  saving,
  saved,
  error,
  saveLabel,
  headerPreview
}) {
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [loginBgFile, setLoginBgFile] = useState(null);
  const brandingIconUrl = getBrandingIconUrl(branding);
  const logoRef = useRef(null);
  const faviconRef = useRef(null);
  const loginBgRef = useRef(null);
  const objectUrlRef = useRef(
    {}
  );
  useEffect(() => {
    return () => {
      Object.values(objectUrlRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);
  const handleFileChange = (event, field, setFile) => {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    setFile(file);
    const previousObjectUrl = objectUrlRef.current[field];
    if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current[field] = objectUrl;
    onChange({ [field]: objectUrl });
  };
  const clearPendingFiles = () => {
    setLogoFile(null);
    setFaviconFile(null);
    setLoginBgFile(null);
    if (logoRef.current) logoRef.current.value = "";
    if (faviconRef.current) faviconRef.current.value = "";
    if (loginBgRef.current) loginBgRef.current.value = "";
  };
  return /* @__PURE__ */ jsxs("div", { className: "settings-tab-panel space-y-5", children: [
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-transform duration-300 hover:-translate-y-0.5", children: headerPreview }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[1.15fr_0.85fr]", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              FieldLabel,
              {
                label: "School name",
                helper: "Shown in the header subtitle."
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: branding.schoolName,
                onChange: (e) => onChange({ schoolName: e.target.value }),
                placeholder: "e.g. St. Clare College of Caloocan",
                className: "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              FieldLabel,
              {
                label: "Canteen name",
                helper: "Short recognizable name for the interface."
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: branding.canteenName,
                onChange: (e) => onChange({ canteenName: e.target.value }),
                placeholder: "e.g. EDUTAP",
                className: "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 p-5", children: [
          /* @__PURE__ */ jsx(
            FieldLabel,
            {
              label: "Theme color",
              helper: "Primary accent for buttons and active UI areas."
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-[auto_132px_1fr]", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "color",
                value: branding.themeColor,
                onChange: (e) => onChange({ themeColor: e.target.value }),
                className: "h-12 w-16 rounded-xl border border-gray-300 bg-white p-1"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: branding.themeColor,
                onChange: (e) => onChange({ themeColor: e.target.value }),
                className: "rounded-xl border border-gray-300 bg-white px-3 py-3 font-mono text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "rounded-xl border border-gray-200",
                style: { backgroundColor: branding.themeColor }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: [
          /* @__PURE__ */ jsx(
            AssetTile,
            {
              label: "Logo",
              helper: "Replaces the default EDUTAP mark.",
              preview: branding.logoUrl,
              onClick: () => {
                var _a;
                return (_a = logoRef.current) == null ? void 0 : _a.click();
              }
            }
          ),
          /* @__PURE__ */ jsx(
            AssetTile,
            {
              label: "Favicon",
              helper: "Shown in the browser tab.",
              preview: branding.faviconUrl,
              onClick: () => {
                var _a;
                return (_a = faviconRef.current) == null ? void 0 : _a.click();
              },
              shape: "square"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2 xl:col-span-1", children: [
            /* @__PURE__ */ jsx(
              FieldLabel,
              {
                label: "Login background",
                helper: "Color wash or hero image behind the login form."
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => onChange({ loginBgType: "color" }),
                  className: `rounded-xl px-3 py-2 text-xs font-semibold transition ${branding.loginBgType === "color" ? "bg-red-950 text-white" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`,
                  children: "Color"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => onChange({ loginBgType: "image" }),
                  className: `rounded-xl px-3 py-2 text-xs font-semibold transition ${branding.loginBgType === "image" ? "bg-red-950 text-white" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`,
                  children: "Image"
                }
              )
            ] }),
            branding.loginBgType === "color" ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "color",
                    value: branding.loginBgColor,
                    onChange: (e) => onChange({ loginBgColor: e.target.value }),
                    className: "h-11 w-14 rounded-xl border border-gray-300 bg-white p-1"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: branding.loginBgColor,
                    onChange: (e) => onChange({ loginBgColor: e.target.value }),
                    className: "min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "mt-3 h-16 rounded-xl border border-gray-200",
                  style: { backgroundColor: branding.loginBgColor }
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              AssetTile,
              {
                label: "Background image",
                helper: "Used behind the login form.",
                preview: branding.loginBgUrl,
                onClick: () => {
                  var _a;
                  return (_a = loginBgRef.current) == null ? void 0 : _a.click();
                },
                shape: "wide"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: logoRef,
            type: "file",
            accept: "image/*",
            className: "hidden",
            onChange: (e) => handleFileChange(e, "logoUrl", setLogoFile)
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: faviconRef,
            type: "file",
            accept: "image/x-icon,image/png,image/svg+xml",
            className: "hidden",
            onChange: (e) => handleFileChange(e, "faviconUrl", setFaviconFile)
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: loginBgRef,
            type: "file",
            accept: "image/*",
            className: "hidden",
            onChange: (e) => handleFileChange(e, "loginBgUrl", setLoginBgFile)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500", children: "Live preview" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Login card and hero treatment" }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500", children: "Responsive" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm sm:rounded-[28px]", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "relative h-32 border-b border-gray-200 sm:h-40 lg:h-44",
              style: branding.loginBgType === "image" && branding.loginBgUrl ? {
                backgroundImage: `url(${branding.loginBgUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover"
              } : { backgroundColor: branding.loginBgColor },
              children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-white/70" })
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "-mt-8 px-3 pb-3 sm:-mt-12 sm:px-4 sm:pb-4 lg:-mt-16 lg:px-5 lg:pb-5", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[24px] border border-gray-200 bg-white px-3.5 py-4 shadow-lg sm:rounded-3xl sm:px-4 sm:py-4 lg:px-5 lg:py-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 sm:items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 sm:h-12 sm:w-12", children: brandingIconUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: brandingIconUrl,
                  alt: "Logo preview",
                  className: "h-full w-full object-cover"
                }
              ) : /* @__PURE__ */ jsx(
                "span",
                {
                  className: "h-7 w-7 rounded-lg",
                  style: { backgroundColor: branding.themeColor }
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-semibold text-gray-900", children: branding.canteenName || "School Canteen" }),
                /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-xs leading-5 text-gray-500", children: branding.schoolName || "Your school name" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "hidden rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 sm:inline-flex", children: "Portal" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2.5 sm:mt-5 sm:space-y-3", children: [
              /* @__PURE__ */ jsx("div", { className: "h-9 rounded-xl border border-gray-200 bg-gray-50 sm:h-10" }),
              /* @__PURE__ */ jsx("div", { className: "h-9 rounded-xl border border-gray-200 bg-gray-50 sm:h-10" }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-9 rounded-xl sm:h-10",
                  style: { backgroundColor: branding.themeColor }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500", children: "Sign in" }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500", children: "Forgot password" })
            ] })
          ] }) })
        ] }),
        error && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: error }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 flex justify-end", children: /* @__PURE__ */ jsx(
          SaveButton,
          {
            saving,
            saved,
            onClick: () => {
              void onSave({ logoFile, faviconFile, loginBgFile }).then(
                clearPendingFiles
              );
            },
            label: saveLabel
          }
        ) })
      ] })
    ] })
  ] });
}
function StaffHeaderPreview({ branding }) {
  const brandingIconUrl = getBrandingIconUrl(branding);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
      style: {
        background: `linear-gradient(to right, ${branding.themeColor}dd, ${branding.themeColor})`
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20", children: brandingIconUrl ? /* @__PURE__ */ jsx(
            "img",
            {
              src: brandingIconUrl,
              alt: "Logo",
              className: "h-full w-full object-cover"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "text-xs text-white", children: "★" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-white", children: branding.canteenName || "EDUTAP" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-white/70", children: branding.schoolName || "School name" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:justify-end", children: [
          ["POS", "History", "Calendar", "Products"].map((label, i) => /* @__PURE__ */ jsx(
            "span",
            {
              className: `rounded-lg px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${i === 0 ? "bg-white text-red-900" : "border border-white/20 bg-white/10 text-white"}`,
              children: label
            },
            label
          )),
          /* @__PURE__ */ jsx("span", { className: "rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-semibold text-red-900", children: "Logout" })
        ] })
      ]
    }
  );
}
function StudentHeaderPreview({ branding }) {
  const brandingIconUrl = getBrandingIconUrl(branding);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
      style: {
        background: `linear-gradient(to right, ${branding.themeColor}dd, ${branding.themeColor})`
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20", children: brandingIconUrl ? /* @__PURE__ */ jsx(
            "img",
            {
              src: brandingIconUrl,
              alt: "Logo",
              className: "h-full w-full object-cover"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "text-xs text-white", children: "★" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-white", children: branding.canteenName || "EDUTAP" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-white/70", children: branding.schoolName || "School name" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:justify-end", children: [
          /* @__PURE__ */ jsx("span", { className: "rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white", children: "Share" }),
          /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-white", children: "S" }) })
        ] })
      ]
    }
  );
}
function AdminHeaderPreview({ branding }) {
  const brandingIconUrl = getBrandingIconUrl(branding);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
      style: {
        background: `linear-gradient(to right, ${branding.themeColor}dd, ${branding.themeColor})`
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20", children: brandingIconUrl ? /* @__PURE__ */ jsx(
            "img",
            {
              src: brandingIconUrl,
              alt: "Logo",
              className: "h-full w-full object-cover"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "text-xs text-white", children: "★" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-white", children: branding.canteenName || "EDUTAP" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-white/70", children: branding.schoolName || "School name" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:justify-end", children: [
          ["Dashboard", "Settings", "Users"].map((label, i) => /* @__PURE__ */ jsx(
            "span",
            {
              className: `rounded-lg px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${i === 0 ? "bg-white text-red-900" : "border border-white/20 bg-white/10 text-white"}`,
              children: label
            },
            label
          )),
          /* @__PURE__ */ jsx("span", { className: "rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-semibold text-red-900", children: "Logout" })
        ] })
      ]
    }
  );
}
function SettingsPage() {
  const [staffBranding, setStaffBranding] = useState(DEFAULT_BRANDING);
  const [studentBranding, setStudentBranding] = useState(DEFAULT_BRANDING);
  const [adminBranding, setAdminBranding] = useState(DEFAULT_BRANDING);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffSaved, setStaffSaved] = useState(false);
  const [staffError, setStaffError] = useState(null);
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentSaved, setStudentSaved] = useState(false);
  const [studentError, setStudentError] = useState(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [transactionsEnabled, setTransactionsEnabled] = useState(true);
  const [savingTx, setSavingTx] = useState(false);
  const [savedTx, setSavedTx] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [categoryError, setCategoryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    ["staff", "student", "admin"].forEach((tab) => {
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
      categories: false
    };
    const markReady = (key) => {
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
      setTransactionsEnabled(snapshot.exists() ? snapshot.data().enabled ?? true : true);
      markReady("tx");
    });
    const unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      setCategories(snapshot.docs.map((d) => ({ id: d.id, name: d.data().name })));
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
  const uploadAsset = async (file, assetKey) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET$1);
    formData.append("folder", "branding");
    formData.append("public_id", `${assetKey}-${Date.now()}`);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME$1}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) throw new Error("Cloudinary upload failed");
    const data = await response.json();
    return data.secure_url;
  };
  const resolveUrl = async (file, existingUrl, assetKey) => {
    if (file) return uploadAsset(file, assetKey);
    if (existingUrl == null ? void 0 : existingUrl.startsWith("blob:")) return null;
    return existingUrl ?? null;
  };
  const saveBranding = async (tab, branding, files, setSaving, setSaved, setError, setBranding) => {
    setSaving(true);
    setError(null);
    try {
      const [nextLogoUrl, nextFaviconUrl, nextLoginBgUrl] = await Promise.all([
        resolveUrl(files.logoFile, branding.logoUrl, `${tab}-logo`),
        resolveUrl(files.faviconFile, branding.faviconUrl, `${tab}-favicon`),
        branding.loginBgType === "image" ? resolveUrl(files.loginBgFile, branding.loginBgUrl, `${tab}-login-bg`) : Promise.resolve(null)
      ]);
      const payload = {
        schoolName: branding.schoolName,
        canteenName: branding.canteenName,
        themeColor: branding.themeColor,
        logoUrl: nextLogoUrl,
        faviconUrl: nextFaviconUrl,
        loginBgType: branding.loginBgType,
        loginBgColor: branding.loginBgColor,
        loginBgUrl: nextLoginBgUrl
      };
      await setDoc(doc(db, "settings", `branding_${tab}`), payload);
      writeBrandingCache(payload, tab);
      setBranding((p) => ({
        ...p,
        logoUrl: nextLogoUrl,
        faviconUrl: nextFaviconUrl,
        loginBgUrl: nextLoginBgUrl
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
  const handleEditSave = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setCategoryError(null);
    try {
      await updateDoc(doc(db, "categories", id), { name: trimmed });
      setCategories((c) => c.map((cat) => cat.id === id ? { ...cat, name: trimmed } : cat));
      setEditingId(null);
    } catch (error) {
      console.error("Failed to rename category:", error);
      setCategoryError("Failed to rename category. Please try again.");
    }
  };
  const handleDeleteCategory = async (id, name) => {
    setCategoryError(null);
    setDeletingId(id);
    try {
      const productsSnap = await getDocs(
        query(collection(db, "products"), where("category", "==", name))
      );
      if (!productsSnap.empty) {
        setCategoryError(
          `Cannot delete "${name}" — it still has ${productsSnap.size} product(s) assigned to it.`
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
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-20 text-sm text-gray-400", children: [
      /* @__PURE__ */ jsx("span", { className: "mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" }),
      "Loading settings..."
    ] });
  }
  const tabs = [
    { key: "staff", label: "Staff / POS", badge: "Staff" },
    { key: "student", label: "Student / Parent", badge: "Student" },
    { key: "admin", label: "Admin", badge: "Admin" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl space-y-6 pb-12", children: [
    /* @__PURE__ */ jsx("section", { className: "settings-enter settings-delay-1 overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-950 via-red-900 to-red-800 text-white shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 px-6 py-7 sm:px-7 lg:grid-cols-[1.35fr_0.65fr]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-[0.22em] text-red-100/80", children: "Admin Settings" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-semibold tracking-tight", children: "Shape how your EDUTAP workspace looks and behaves." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-red-100/85", children: "Update school identity per interface, control transactions, and organize product categories from one place." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-3 lg:grid-cols-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100/75", children: "Transactions" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-semibold", children: transactionsEnabled ? "Enabled" : "Disabled" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100/75", children: "Interfaces" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-semibold", children: "3 branded" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100/75", children: "Categories" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-semibold", children: categories.length })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      SectionCard,
      {
        className: "settings-enter settings-delay-2",
        eyebrow: "Operations",
        title: "Global Transaction Controls",
        description: "Pause or resume system-wide transaction activity for maintenance windows or emergency lockouts.",
        children: /* @__PURE__ */ jsxs("div", { className: "grid gap-5 lg:grid-cols-[1fr_220px]", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-base font-semibold text-gray-900", children: "Transaction State" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: transactionsEnabled ? "Users can currently make purchases and top-ups." : "All purchase and top-up actions are currently blocked." })
            ] }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${transactionsEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`,
                children: transactionsEnabled ? "ENABLED" : "DISABLED"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-gray-200 bg-white px-5 py-5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-800", children: "Quick Toggle" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: transactionsEnabled ? "Live" : "Paused" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleToggleTransactions,
                  disabled: savingTx,
                  className: `relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${transactionsEnabled ? "bg-red-950" : "bg-gray-300"} ${savingTx ? "opacity-60" : ""}`,
                  role: "switch",
                  "aria-checked": transactionsEnabled,
                  children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${transactionsEnabled ? "translate-x-5" : "translate-x-0"}`
                    }
                  )
                }
              )
            ] }),
            savedTx && /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs font-medium text-green-600", children: "Transaction setting saved." })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs(
      SectionCard,
      {
        className: "settings-enter settings-delay-3",
        eyebrow: "Identity",
        title: "Branding and Page Presentation",
        description: "Customize branding independently for each interface — Staff, Student, and Admin.",
        children: [
          /* @__PURE__ */ jsx("div", { className: "mb-6 grid grid-cols-1 gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1 sm:grid-cols-3", children: tabs.map((tab) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab(tab.key),
              className: `flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${activeTab === tab.key ? "bg-white text-gray-900 shadow-sm -translate-y-0.5" : "text-gray-500 hover:bg-white/70 hover:text-gray-700"}`,
              children: [
                tab.label,
                activeTab === tab.key && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800", children: tab.badge })
              ]
            },
            tab.key
          )) }),
          activeTab === "staff" && /* @__PURE__ */ jsx(
            BrandingPanel,
            {
              branding: staffBranding,
              onChange: (next) => setStaffBranding((p) => ({ ...p, ...next })),
              onSave: (files) => saveBranding(
                "staff",
                staffBranding,
                files,
                setStaffSaving,
                setStaffSaved,
                setStaffError,
                setStaffBranding
              ),
              saving: staffSaving,
              saved: staffSaved,
              error: staffError,
              saveLabel: "Save Staff Branding",
              headerPreview: /* @__PURE__ */ jsx(StaffHeaderPreview, { branding: staffBranding })
            },
            "staff"
          ),
          activeTab === "student" && /* @__PURE__ */ jsx(
            BrandingPanel,
            {
              branding: studentBranding,
              onChange: (next) => setStudentBranding((p) => ({ ...p, ...next })),
              onSave: (files) => saveBranding(
                "student",
                studentBranding,
                files,
                setStudentSaving,
                setStudentSaved,
                setStudentError,
                setStudentBranding
              ),
              saving: studentSaving,
              saved: studentSaved,
              error: studentError,
              saveLabel: "Save Student Branding",
              headerPreview: /* @__PURE__ */ jsx(StudentHeaderPreview, { branding: studentBranding })
            },
            "student"
          ),
          activeTab === "admin" && /* @__PURE__ */ jsx(
            BrandingPanel,
            {
              branding: adminBranding,
              onChange: (next) => setAdminBranding((p) => ({ ...p, ...next })),
              onSave: (files) => saveBranding(
                "admin",
                adminBranding,
                files,
                setAdminSaving,
                setAdminSaved,
                setAdminError,
                setAdminBranding
              ),
              saving: adminSaving,
              saved: adminSaved,
              error: adminError,
              saveLabel: "Save Admin Branding",
              headerPreview: /* @__PURE__ */ jsx(AdminHeaderPreview, { branding: adminBranding })
            },
            "admin"
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      SectionCard,
      {
        className: "settings-enter settings-delay-4",
        eyebrow: "Catalog",
        title: "Category Manager",
        description: "Add, rename, and remove product categories used by the inventory module.",
        children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[0.78fr_1.22fr]", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-gray-200 bg-gray-50 p-5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-900", children: "Create a New Category" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Keep names short and consistent so inventory stays organized." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: newCategoryName,
                  onChange: (e) => setNewCategoryName(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") void handleAddCategory();
                  },
                  placeholder: "e.g. Beverages",
                  className: "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
                }
              ),
              /* @__PURE__ */ jsx(
                SaveButton,
                {
                  saving: addingCategory,
                  saved: false,
                  onClick: () => void handleAddCategory(),
                  label: "Add Category"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500", children: "Current Count" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-gray-900", children: categories.length })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            categoryError && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4", children: [
              /* @__PURE__ */ jsx("div", { className: "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-red-800", children: "Category Action Failed" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-700", children: categoryError })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setCategoryError(null),
                  className: "text-sm font-medium text-red-500 hover:text-red-700",
                  children: "Close"
                }
              )
            ] }),
            categories.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 text-center text-sm text-gray-400", children: "No categories yet. Add your first category from the left panel." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: categories.map((category) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400", children: "Category" }),
                      editingId === category.id ? /* @__PURE__ */ jsx(
                        "input",
                        {
                          autoFocus: true,
                          type: "text",
                          value: editingName,
                          onChange: (e) => setEditingName(e.target.value),
                          onKeyDown: (e) => {
                            if (e.key === "Enter")
                              void handleEditSave(category.id);
                            if (e.key === "Escape")
                              setEditingId(null);
                          },
                          className: "mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
                        }
                      ) : /* @__PURE__ */ jsx("h4", { className: "mt-2 truncate text-base font-semibold text-gray-900", children: category.name })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-900/60" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: editingId === category.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => void handleEditSave(category.id),
                        className: "rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700",
                        children: "Save"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setEditingId(null),
                        className: "rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50",
                        children: "Cancel"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                          setCategoryError(null);
                        },
                        className: "rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50",
                        children: "Rename"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => void handleDeleteCategory(
                          category.id,
                          category.name
                        ),
                        disabled: deletingId === category.id,
                        className: "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50",
                        children: deletingId === category.id ? "Deleting..." : "Delete"
                      }
                    )
                  ] }) })
                ]
              },
              category.id
            )) })
          ] })
        ] })
      }
    )
  ] });
}
function StatsCards({ totalSales, totalOrders, totalTopUps }) {
  return /* @__PURE__ */ jsxs("div", { className: "settings-enter settings-delay-1 mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "admin-surface px-6 py-5", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500", children: "Total Sales" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-3xl font-semibold text-gray-900", children: totalSales }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Gross sales recorded for today." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-surface px-6 py-5", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500", children: "Total Orders" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-3xl font-semibold text-gray-900", children: totalOrders }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Completed and pending orders today." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-surface px-6 py-5", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500", children: "Total Top-Ups" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-3xl font-semibold text-gray-900", children: totalTopUps }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Approved wallet funding for today." })
    ] })
  ] });
}
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate();
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return new Date(value.seconds * 1e3);
    }
  }
  return null;
}
function formatDate(value) {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : "-";
}
function SystemArchivePage() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "OK"
  });
  const closeDialog = () => setDialog((current) => ({
    ...current,
    isOpen: false,
    onConfirm: void 0
  }));
  const showNotice = (title, message, variant = "info") => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant,
      confirmLabel: "Got it"
    });
  };
  const showConfirm = (title, message, onConfirm, confirmLabel = "Continue") => {
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
      }
    });
  };
  useEffect(() => {
    const unsubscribeArchives = onSnapshot(
      collection(db, "archives"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data()
        }));
        setArchives(data);
        setLoading(false);
      },
      (err) => {
        console.error("Archives listener failed:", err.message);
        showNotice("Archive Load Failed", err.message, "danger");
        setLoading(false);
      }
    );
    return () => {
      unsubscribeArchives();
    };
  }, []);
  const filteredArchives = useMemo(() => {
    const term = archiveSearch.toLowerCase();
    return archives.filter(
      (archive) => archive.id.toLowerCase().includes(term) || (archive.displayName ?? "").toLowerCase().includes(term) || (archive.email ?? "").toLowerCase().includes(term) || (archive.originalCollection ?? "").toLowerCase().includes(term)
    );
  }, [archives, archiveSearch]);
  const handleRestore = (archiveId) => {
    showConfirm(
      "Restore Document",
      "Restore this archived document back to its original collection?",
      () => {
        void (async () => {
          try {
            await restoreDocument(archiveId);
            showNotice("Restored", "Document restored successfully.", "success");
          } catch (err) {
            showNotice("Restore Failed", err.message, "danger");
          }
        })();
      },
      "Restore"
    );
  };
  const handleDelete = (archiveId) => {
    showConfirm(
      "Delete Archived Document",
      "This permanently deletes the archived record. Continue?",
      () => {
        void (async () => {
          try {
            await deleteArchivedDocument(archiveId);
            showNotice("Deleted", "Archived document permanently deleted.", "success");
          } catch (err) {
            showNotice("Delete Failed", err.message, "danger");
          }
        })();
      },
      "Delete"
    );
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500", children: "Loading archives..." });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-2", children: "System Archive" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Archived records are shown here. Use Restore or Delete for each item." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-8", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-6 flex items-center justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Archives Collection" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Records archived from active collections." })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "relative mb-6 max-w-sm", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search archives...",
              value: archiveSearch,
              onChange: (event) => setArchiveSearch(event.target.value),
              className: "w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Archive ID" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Original Collection" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Identity" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Window" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: filteredArchives.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "text-center py-8 text-gray-400", children: "No archived documents found." }) }) : filteredArchives.map((archive) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50", children: [
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-xs font-mono text-gray-700", children: archive.id }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-700", children: archive.originalCollection || "-" }),
            /* @__PURE__ */ jsxs("td", { className: "py-4 px-4 text-sm text-gray-700", children: [
              /* @__PURE__ */ jsx("div", { children: archive.displayName || "-" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: archive.email || archive.uid || "-" })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "py-4 px-4 text-sm text-gray-700", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                "Archived: ",
                formatDate(archive.archivedAt)
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500", children: [
                "Delete after: ",
                formatDate(archive.deleteAt)
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleRestore(archive.id),
                  className: "inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50",
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5" }),
                    "Restore"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => handleDelete(archive.id),
                  className: "inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50",
                  children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
                    "Delete"
                  ]
                }
              )
            ] }) })
          ] }, archive.id)) })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      SystemDialog,
      {
        isOpen: dialog.isOpen,
        title: dialog.title,
        message: dialog.message,
        variant: dialog.variant,
        confirmLabel: dialog.confirmLabel,
        cancelLabel: dialog.cancelLabel,
        onClose: closeDialog,
        onConfirm: dialog.onConfirm
      }
    )
  ] });
}
function TransactionsTable({
  transactions,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Approved":
      case "approved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  return /* @__PURE__ */ jsxs("div", { className: "settings-enter settings-delay-2 admin-surface overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b border-gray-100 bg-gradient-to-r from-white via-red-50/40 to-white p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Recent Transactions" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Monitor purchases and top-up activity in one stream." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search by Staff or Student...",
            value: searchQuery,
            onChange: (e) => onSearchChange(e.target.value),
            className: "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-900/40 focus:ring-4 focus:ring-red-100"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["All", "Completed", "Pending", "Cancelled", "Approved"].map((filter) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onFilterChange(filter),
            className: `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${activeFilter === filter ? "bg-red-950 text-white shadow-sm -translate-y-0.5" : "bg-gray-100 text-gray-600 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-900"}`,
            children: filter
          },
          filter
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Staff / Student" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Details" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-medium text-gray-700", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: sorted.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
          "td",
          {
            colSpan: 5,
            className: "py-10 text-center text-sm text-gray-400",
            children: "No transactions found."
          }
        ) }) : sorted.map((t) => /* @__PURE__ */ jsxs(
          "tr",
          {
            className: "border-b border-gray-100 transition-colors duration-300 hover:bg-red-50/40",
            children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm", children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: `rounded-full px-2.5 py-1 text-xs font-semibold ${t.type === "topup" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"}`,
                  children: t.type === "topup" ? "💳 Top-Up" : "🛒 Purchase"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm", children: t.type === "topup" ? t.studentName ?? "—" : t.staffName ?? "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm text-gray-600", children: t.type === "topup" ? `Via ${t.paymentMethod ?? "GCash"}` : Array.isArray(t.items) ? t.items.map((i) => `${i.name} x${i.quantity}`).join(", ") : "—" }),
              /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-sm font-medium", children: [
                "₱",
                ((t.type === "topup" ? t.amount : t.total) ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm", children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: `rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(t.status)}`,
                  children: t.status === "approved" || t.status === "Approved" ? "Approved" : t.status
                }
              ) })
            ]
          },
          t.id
        )) })
      ] }) })
    ] })
  ] });
}
const CLOUDINARY_CLOUD_NAME = "dvjilvllm";
const CLOUDINARY_UPLOAD_PRESET = "edutap_student_photos";
const MAX_STUDENTS_PER_PARENT = 5;
const PARENT_LINK_LIMIT_MESSAGE = "This parent already has the maximum of 5 linked students.";
const EMPTY_FORM = {
  name: "",
  gradeLevel: "",
  lrn: "",
  schoolEmail: "",
  guardianName: "",
  guardianEmail: "",
  parentAccountId: "",
  contactNumber: "",
  rfidSerial: ""
};
async function countLinkedStudentsForParent(parentUid) {
  const linkedSnapshot = await getDocs(
    query(collection(db, "students"), where("guardianId", "==", parentUid))
  );
  return linkedSnapshot.size;
}
function getParentDisplayName(parent) {
  return parent.name || parent.displayName || parent.email || "Parent";
}
function StudentPage() {
  const [students, setStudents] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkParentId, setLinkParentId] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [allowEmailEdit, setAllowEmailEdit] = useState(false);
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "OK"
  });
  const fileInputRef = useRef(null);
  const rfidInputRef = useRef(null);
  const closeFormModal = () => setShowForm(false);
  const closeLinkModal = () => setShowLinkForm(false);
  const closeDialog = () => setDialog((current) => ({
    ...current,
    isOpen: false,
    onConfirm: void 0
  }));
  const showNotice = (title, message, variant = "info") => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant,
      confirmLabel: "Got it"
    });
  };
  const showConfirm = (title, message, onConfirm, confirmLabel = "Continue") => {
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
      }
    });
  };
  useEffect(() => {
    const q = query(collection(db, "students"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["parent", "Parent"]));
    const unsub = onSnapshot(q, (snap) => {
      const parents = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((parent) => Boolean(parent.email)).sort((a, b) => getParentDisplayName(a).localeCompare(getParentDisplayName(b)));
      setParentAccounts(parents);
    });
    return unsub;
  }, []);
  useEffect(() => {
    if (showForm && showLinkForm) {
      setShowLinkForm(false);
    }
  }, [showForm, showLinkForm]);
  const filtered = students.filter(
    (s) => {
      var _a, _b, _c, _d;
      return ((_a = s.name) == null ? void 0 : _a.toLowerCase().includes(search.toLowerCase())) || ((_b = s.lrn) == null ? void 0 : _b.toLowerCase().includes(search.toLowerCase())) || ((_c = s.gradeLevel) == null ? void 0 : _c.toLowerCase().includes(search.toLowerCase())) || ((_d = s.guardianName) == null ? void 0 : _d.toLowerCase().includes(search.toLowerCase()));
    }
  );
  const selectedLinkParent = parentAccounts.find((parent) => parent.id === linkParentId);
  const selectedLinkStudent = students.find((student) => student.id === linkStudentId);
  const selectedFormParent = parentAccounts.find(
    (parent) => parent.id === formData.parentAccountId
  );
  const selectedParentLinkedCount = linkParentId ? students.filter((student) => student.guardianId === linkParentId).length : 0;
  const selectedFormParentLinkedCount = selectedFormParent ? students.filter((student) => student.guardianId === selectedFormParent.id).length : 0;
  const selectedParentIsFull = Boolean(selectedLinkParent && selectedLinkStudent) && selectedParentLinkedCount >= MAX_STUDENTS_PER_PARENT && (selectedLinkStudent == null ? void 0 : selectedLinkStudent.guardianId) !== (selectedLinkParent == null ? void 0 : selectedLinkParent.id);
  const selectedFormParentIsFull = !editingId && Boolean(selectedFormParent) && selectedFormParentLinkedCount >= MAX_STUDENTS_PER_PARENT;
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleParentAccountChange = (e) => {
    const parentAccountId = e.target.value;
    const parent = parentAccounts.find((account) => account.id === parentAccountId);
    setFormData((current) => {
      var _a;
      return {
        ...current,
        parentAccountId,
        ...parent ? {
          guardianName: getParentDisplayName(parent),
          guardianEmail: ((_a = parent.email) == null ? void 0 : _a.trim().toLowerCase()) ?? ""
        } : {}
      };
    });
  };
  const handlePhotoChange = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const uploadPhoto = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: fd }
    );
    if (!res.ok) throw new Error("Failed to upload photo");
    return (await res.json()).secure_url;
  };
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
  const openEdit = (student) => {
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
      rfidSerial: student.rfidSerial
    });
    setPhotoFile(null);
    setPhotoPreview(student.photoUrl || null);
    setShowForm(true);
  };
  const openLinkStudent = (student) => {
    if (parentAccounts.length === 0) {
      showNotice(
        "No Parent Accounts",
        "Create a parent account first, then assign students to it.",
        "info"
      );
      return;
    }
    setShowForm(false);
    const existingParentId = (student == null ? void 0 : student.guardianId) && parentAccounts.some((parent) => parent.id === student.guardianId) ? student.guardianId : parentAccounts[0].id;
    setLinkStudentId((student == null ? void 0 : student.id) ?? "");
    setLinkParentId(existingParentId);
    setShowLinkForm(true);
  };
  const handleDelete = async (id) => {
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
                details: `Student account for ${studentToDelete.name} was archived.`
              });
            }
            showNotice(
              "Student Archived",
              "Student was archived and can be restored from System Archive.",
              "success"
            );
          } catch (err) {
            showNotice("Archive Failed", "Error: " + err.message, "danger");
          }
        })();
      },
      "Archive"
    );
  };
  const handleSaveStudentLink = async () => {
    var _a;
    if (!selectedLinkStudent || !selectedLinkParent) {
      showNotice("Missing Selection", "Select a student and parent account.", "danger");
      return;
    }
    const parentEmail = (_a = selectedLinkParent.email) == null ? void 0 : _a.trim().toLowerCase();
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
        guardianName: getParentDisplayName(selectedLinkParent)
      });
      await writeAccountAuditLog({
        action: "updated",
        targetType: "student",
        targetId: selectedLinkStudent.id,
        targetName: selectedLinkStudent.name,
        details: `Student assigned to parent account ${parentEmail}.`
      });
      setShowLinkForm(false);
      showNotice(
        "Student Link Saved",
        "Student is now assigned to the selected parent account.",
        "success"
      );
    } catch (err) {
      showNotice("Save Link Failed", "Error: " + err.message, "danger");
    } finally {
      setLinkSaving(false);
    }
  };
  const handleSubmit = async () => {
    var _a;
    const parentForNewStudent = !editingId ? selectedFormParent : null;
    const guardianName = parentForNewStudent ? getParentDisplayName(parentForNewStudent) : formData.guardianName.trim();
    const normalizedGuardianEmail = ((parentForNewStudent == null ? void 0 : parentForNewStudent.email) ?? formData.guardianEmail).trim().toLowerCase();
    if (!formData.name || !formData.lrn || !formData.gradeLevel || !guardianName || !normalizedGuardianEmail || !formData.contactNumber || !formData.rfidSerial) {
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
      if (editingId && editingStudent) {
        const newEmail = normalizedGuardianEmail;
        const oldEmail = (_a = editingStudent.guardianEmail) == null ? void 0 : _a.toLowerCase();
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
          ...photoFile ? { photoUrl } : {}
        });
        const changeSummary = [
          editingStudent.name !== formData.name ? `student name: "${editingStudent.name}" -> "${formData.name}"` : null,
          editingStudent.guardianName !== guardianName ? `guardian: "${editingStudent.guardianName}" -> "${guardianName}"` : null,
          editingStudent.contactNumber !== formData.contactNumber ? `contact: "${editingStudent.contactNumber}" -> "${formData.contactNumber}"` : null,
          editingStudent.rfidSerial !== formData.rfidSerial ? `RFID: "${editingStudent.rfidSerial}" -> "${formData.rfidSerial}"` : null,
          emailChanged ? `guardian email: "${oldEmail ?? "-"}" -> "${newEmail}"` : null
        ].filter(Boolean).join(", ");
        await writeAccountAuditLog({
          action: "updated",
          targetType: "student",
          targetId: editingId,
          targetName: formData.name,
          details: changeSummary || "Student account details were updated."
        });
        showNotice("Student Updated", "Student updated successfully!", "success");
      } else {
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
          ...parentForNewStudent ? { guardianId: parentForNewStudent.id } : {},
          status: "Active",
          createdAt: Date.now()
        });
        await writeAccountAuditLog({
          action: "created",
          targetType: "student",
          targetId: studentRef.id,
          targetName: formData.name,
          details: parentForNewStudent ? `Student record created and assigned to parent account ${normalizedGuardianEmail}.` : "Student record created without a linked parent account."
        });
        showNotice(
          parentForNewStudent ? "Student Added and Linked" : "Student Added",
          parentForNewStudent ? "Student record created and assigned to the selected parent." : "Student record created successfully.",
          "success"
        );
      }
      setShowForm(false);
    } catch (err) {
      showNotice("Save Failed", "Error: " + err.message, "danger");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500", children: [
      /* @__PURE__ */ jsx(Loader, { className: "inline h-5 w-5 animate-spin mr-2" }),
      "Loading students..."
    ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-1", children: "Student Management" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Manage student profiles, guardian info, and RFID cards." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => openLinkStudent(),
              className: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md",
              children: [
                /* @__PURE__ */ jsx(Link2, { className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: "Link Existing Student" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(AdminPrimaryButton, { onClick: openAdd, children: "Add Student" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative mb-6 max-w-sm", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search by name, LRN, grade...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          }
        ),
        search && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSearch(""),
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Student" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Grade" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Guardian" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Contact" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "RFID" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Balance" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "text-center py-8 text-gray-400", children: search ? "No students match your search." : "No students yet." }) }) : filtered.map((student) => /* @__PURE__ */ jsxs(
          "tr",
          {
            className: "border-b border-gray-100 hover:bg-gray-50",
            children: [
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                student.photoUrl ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: student.photoUrl,
                    alt: student.name,
                    className: "w-10 h-10 rounded-full object-cover border border-gray-200"
                  }
                ) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-gray-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900", children: student.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-600", children: "LRN:" }),
                    " ",
                    /* @__PURE__ */ jsx("span", { className: "font-mono", children: student.lrn })
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium", children: student.gradeLevel }) }),
              /* @__PURE__ */ jsxs("td", { className: "py-4 px-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900", children: student.guardianName }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: student.guardianEmail })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-600", children: [
                /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5" }),
                student.contactNumber || "—"
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded", children: student.rfidSerial || "—" }) }),
              /* @__PURE__ */ jsxs("td", { className: "py-4 px-4 text-sm font-semibold text-gray-900", children: [
                "₱",
                (student.balance ?? 0).toFixed(2)
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => openEdit(student),
                    className: "flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" }),
                      " Edit"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => openLinkStudent(student),
                    className: "flex items-center gap-1 px-3 py-1 text-sm text-red-800 hover:bg-red-50 rounded-lg transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Link2, { className: "w-3.5 h-3.5" }),
                      " Assign to Parent"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleDelete(student.id),
                    className: "flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }),
                      " Remove"
                    ]
                  }
                )
              ] }) })
            ]
          },
          student.id
        )) })
      ] }) })
    ] }),
    showLinkForm && /* @__PURE__ */ jsx(AdminModalPortal, { children: /* @__PURE__ */ jsx("div", { className: "admin-modal-backdrop", children: /* @__PURE__ */ jsxs("div", { className: "admin-modal-panel relative max-w-xl rounded-2xl bg-white p-6 shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Link Existing Student" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Assign a student record to a parent account." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: closeLinkModal,
            disabled: linkSaving,
            className: "text-gray-400 hover:text-gray-600 disabled:opacity-50",
            children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Parent Account" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: linkParentId,
              onChange: (event) => setLinkParentId(event.target.value),
              disabled: linkSaving,
              className: "w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50",
              children: parentAccounts.map((parent) => /* @__PURE__ */ jsxs("option", { value: parent.id, children: [
                getParentDisplayName(parent),
                " - ",
                parent.email
              ] }, parent.id))
            }
          ),
          /* @__PURE__ */ jsx(
            "p",
            {
              className: `mt-2 text-xs font-medium ${selectedParentIsFull ? "text-red-700" : "text-gray-500"}`,
              children: selectedParentIsFull ? PARENT_LINK_LIMIT_MESSAGE : `${selectedParentLinkedCount}/${MAX_STUDENTS_PER_PARENT} students linked`
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Student" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: linkStudentId,
              onChange: (event) => setLinkStudentId(event.target.value),
              disabled: linkSaving,
              className: "w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select student" }),
                students.map((student) => /* @__PURE__ */ jsxs("option", { value: student.id, children: [
                  student.name,
                  " - LRN ",
                  student.lrn
                ] }, student.id))
              ]
            }
          ),
          (selectedLinkStudent == null ? void 0 : selectedLinkStudent.guardianName) && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-gray-500", children: [
            "Current parent: ",
            selectedLinkStudent.guardianName
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: closeLinkModal,
            disabled: linkSaving,
            className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSaveStudentLink,
            disabled: linkSaving || !linkParentId || !linkStudentId,
            className: "flex-1 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50",
            children: linkSaving ? "Saving..." : "Save Student Link"
          }
        )
      ] })
    ] }) }) }),
    showForm && /* @__PURE__ */ jsx(AdminModalPortal, { children: /* @__PURE__ */ jsx("div", { className: "admin-modal-backdrop", children: /* @__PURE__ */ jsxs("div", { className: "admin-modal-panel relative max-w-2xl rounded-2xl bg-white p-6 shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: editingId ? "Edit Student" : "Add New Student" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: editingId ? "Update student information." : "Fill in the details below." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: closeFormModal,
            disabled: saving,
            className: "text-gray-400 hover:text-gray-600 disabled:opacity-50",
            children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Student Photo" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          photoPreview ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: photoPreview,
                className: "w-20 h-24 object-cover rounded-lg border-2 border-gray-300"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                },
                className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "w-20 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400", children: "No photo" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              onChange: handlePhotoChange,
              className: "hidden",
              id: "modal-photo"
            }
          ),
          /* @__PURE__ */ jsx(
            "label",
            {
              htmlFor: "modal-photo",
              className: "cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors",
              children: "Upload Photo"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3", children: "Student Details" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5", children: [
        [
          { label: "Full Name", name: "name", placeholder: "Juan Dela Cruz" },
          { label: "LRN", name: "lrn", placeholder: "123456789012" },
          {
            label: "School Email",
            name: "schoolEmail",
            placeholder: "student@school.edu.ph"
          }
        ].map((f) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: f.name === "schoolEmail" ? "sm:col-span-2" : "",
            children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: f.label }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  name: f.name,
                  value: formData[f.name],
                  onChange: handleChange,
                  placeholder: f.placeholder,
                  disabled: saving || !editingId && Boolean(selectedFormParent) && f.name === "guardianName",
                  className: "w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                }
              )
            ]
          },
          f.name
        )),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Grade Level" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              name: "gradeLevel",
              value: formData.gradeLevel,
              onChange: handleChange,
              disabled: saving,
              className: "w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Grade Level" }),
                [
                  "Grade 1",
                  "Grade 2",
                  "Grade 3",
                  "Grade 4",
                  "Grade 5",
                  "Grade 6"
                ].map((g) => /* @__PURE__ */ jsx("option", { value: g, children: g }, g))
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3", children: "Guardian Information" }),
      !editingId && /* @__PURE__ */ jsxs("div", { className: "mb-5 rounded-lg border border-red-100 bg-red-50/40 p-4", children: [
        /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Parent Account (Optional)" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            name: "parentAccountId",
            value: formData.parentAccountId,
            onChange: handleParentAccountChange,
            disabled: saving,
            className: "w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "No parent selected" }),
              parentAccounts.map((parent) => /* @__PURE__ */ jsxs("option", { value: parent.id, children: [
                getParentDisplayName(parent),
                " - ",
                parent.email
              ] }, parent.id))
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "p",
          {
            className: `mt-2 text-xs font-medium ${selectedFormParentIsFull ? "text-red-700" : "text-gray-500"}`,
            children: selectedFormParentIsFull ? PARENT_LINK_LIMIT_MESSAGE : selectedFormParent ? `${selectedFormParentLinkedCount}/${MAX_STUDENTS_PER_PARENT} students linked to this parent` : "Leave blank to add a student-only record. Choose a parent to link now."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5", children: [
        [
          {
            label: "Guardian Name",
            name: "guardianName",
            placeholder: "Maria Dela Cruz"
          },
          {
            label: "Contact Number",
            name: "contactNumber",
            placeholder: "09XX XXX XXXX"
          }
        ].map((f) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: f.label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: f.name,
              value: formData[f.name],
              onChange: handleChange,
              placeholder: f.placeholder,
              disabled: saving,
              className: "w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
            }
          )
        ] }, f.name)),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Guardian Email" }),
            editingId && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setAllowEmailEdit((v) => !v),
                className: "text-xs text-blue-600 hover:underline",
                children: allowEmailEdit ? "Lock email" : "Change email"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "guardianEmail",
              value: formData.guardianEmail,
              onChange: handleChange,
              placeholder: "guardian@example.com",
              disabled: saving || !editingId && Boolean(selectedFormParent) || !!editingId && !allowEmailEdit,
              className: "w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:bg-gray-50"
            }
          ),
          !editingId && selectedFormParent && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Guardian details will be saved from the selected parent account." }),
          editingId && allowEmailEdit && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 mt-1", children: "⚠️ Updates the database email. Deploy the Cloud Function to also update the login email." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3", children: "RFID Card" }),
      /* @__PURE__ */ jsx("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6", children: /* @__PURE__ */ jsx(
        "input",
        {
          ref: rfidInputRef,
          type: "text",
          name: "rfidSerial",
          value: formData.rfidSerial,
          onChange: handleChange,
          disabled: saving,
          onKeyDown: (e) => {
            var _a;
            if (e.key === "Enter") {
              e.preventDefault();
              (_a = rfidInputRef.current) == null ? void 0 : _a.blur();
            }
          },
          className: "w-full p-3 border-2 border-dashed border-gray-400 rounded-md text-center font-mono text-sm bg-white focus:outline-none focus:border-black disabled:opacity-50",
          placeholder: "Tap card to scan..."
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: closeFormModal,
            disabled: saving,
            className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSubmit,
            disabled: saving || selectedFormParentIsFull,
            className: "flex-1 px-4 py-2 bg-red-950 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50",
            children: saving ? "Saving..." : editingId ? "Update Student" : "Add Student"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(
      SystemDialog,
      {
        isOpen: dialog.isOpen,
        title: dialog.title,
        message: dialog.message,
        variant: dialog.variant,
        confirmLabel: dialog.confirmLabel,
        cancelLabel: dialog.cancelLabel,
        onClose: closeDialog,
        onConfirm: dialog.onConfirm
      }
    )
  ] });
}
const adminPanel = withComponentProps(function AdminPanel() {
  const getToday = () => {
    const now = /* @__PURE__ */ new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: ""
  });
  const [transactions, setTransactions] = useState([]);
  const [topUps, setTopUps] = useState([]);
  const [logDate, setLogDate] = useState(getToday());
  const [totalTopUps, setTotalTopUps] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      var _a;
      if (!user) {
        window.location.href = "/";
        return;
      }
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const firestoreRole = userSnap.exists() ? (_a = userSnap.data().role) == null ? void 0 : _a.toLowerCase() : null;
      if (firestoreRole !== "admin") {
        window.location.href = "/";
        return;
      }
      localStorage.setItem("role", firestoreRole);
      setUsername(user.displayName || user.email || "Admin");
      setRole(firestoreRole);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const updateTime = () => {
      const now = /* @__PURE__ */ new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 6e4);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!isAuthReady) return;
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);
    const transactionsQuery = query(collection(db, "transactions"), where("timestamp", ">=", startOfDay.getTime()), where("timestamp", "<=", endOfDay.getTime()));
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const data = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        type: "transaction",
        ...snapshotDoc.data()
      }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [logDate, isAuthReady]);
  useEffect(() => {
    if (!isAuthReady) return;
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);
    const topUpStatsQuery = query(collection(db, "topup_requests"), where("status", "==", "approved"), where("timestamp", ">=", startOfDay.getTime()), where("timestamp", "<=", endOfDay.getTime()));
    const unsubscribe = onSnapshot(topUpStatsQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, snapshotDoc) => sum + (snapshotDoc.data().amount || 0), 0);
      setTotalTopUps(total);
    });
    const now = /* @__PURE__ */ new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const midnightTimer = setTimeout(() => setLogDate(getToday()), msUntilMidnight);
    return () => {
      unsubscribe();
      clearTimeout(midnightTimer);
    };
  }, [logDate, isAuthReady]);
  useEffect(() => {
    if (!isAuthReady) return;
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);
    const topUpsQuery = query(collection(db, "topup_requests"), where("timestamp", ">=", startOfDay.getTime()), where("timestamp", "<=", endOfDay.getTime()));
    const unsubscribe = onSnapshot(topUpsQuery, (snapshot) => {
      const data = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        type: "topup",
        status: snapshotDoc.data().status === "approved" ? "Approved" : snapshotDoc.data().status === "rejected" ? "Cancelled" : "Pending",
        studentName: snapshotDoc.data().studentName,
        paymentMethod: snapshotDoc.data().paymentMethod,
        amount: snapshotDoc.data().amount,
        timestamp: snapshotDoc.data().timestamp
      }));
      setTopUps(data);
    });
    return () => unsubscribe();
  }, [logDate, isAuthReady]);
  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "/";
  };
  const closeModal = () => setShowModal(false);
  const totalSales = transactions.reduce((sum, transaction) => sum + (isNaN(transaction.total ?? 0) ? 0 : transaction.total ?? 0), 0);
  const mergedTransactions = [...transactions.map((transaction) => ({
    ...transaction,
    type: "transaction"
  })), ...topUps].filter((transaction) => {
    var _a, _b, _c;
    const matchesSearch = transaction.type === "topup" ? (_a = transaction.studentName) == null ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase()) : ((_b = transaction.staffName) == null ? void 0 : _b.toLowerCase().includes(searchQuery.toLowerCase())) || ((_c = transaction.orderId) == null ? void 0 : _c.toLowerCase().includes(searchQuery.toLowerCase()));
    const status = transaction.status || "Completed";
    const matchesFilter = activeFilter === "All" || status === activeFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.timestamp - a.timestamp);
  return /* @__PURE__ */ jsxs("div", {
    className: "flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(127,29,29,0.08),_transparent_32%),linear-gradient(to_bottom,_#fff7f7,_#f8fafc_28%,_#f9fafb)]",
    children: [/* @__PURE__ */ jsx(AdminHeader, {
      displayName: username,
      role,
      currentTime,
      onLogout: handleLogout
    }), /* @__PURE__ */ jsxs("div", {
      className: "relative flex flex-1 overflow-hidden",
      children: [/* @__PURE__ */ jsxs("main", {
        className: "min-w-0 flex-1 overflow-y-auto p-6",
        children: [currentPage === "dashboard" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx(StatsCards, {
            totalSales: `PHP ${totalSales.toLocaleString("en-PH", {
              minimumFractionDigits: 2
            })}`,
            totalOrders: transactions.length,
            totalTopUps: `PHP ${totalTopUps.toLocaleString("en-PH", {
              minimumFractionDigits: 2
            })}`
          }), /* @__PURE__ */ jsx(TransactionsTable, {
            transactions: mergedTransactions,
            searchQuery,
            onSearchChange: setSearchQuery,
            activeFilter,
            onFilterChange: (filter) => setActiveFilter(filter)
          })]
        }), currentPage === "products" && /* @__PURE__ */ jsx(ProductsInventory, {}), currentPage === "staff" && /* @__PURE__ */ jsx(StaffPage, {}), currentPage === "users" && /* @__PURE__ */ jsx(StudentPage, {}), currentPage === "topups" && /* @__PURE__ */ jsx(PendingRequests, {}), currentPage === "logs" && /* @__PURE__ */ jsx(AccountLogsPage, {}), currentPage === "systemArchive" && /* @__PURE__ */ jsx(SystemArchivePage, {}), currentPage === "settings" && isAuthReady && /* @__PURE__ */ jsx(SettingsPage, {})]
      }), /* @__PURE__ */ jsx("aside", {
        className: "w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white/75 p-6 backdrop-blur-sm",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col gap-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "settings-enter settings-delay-3",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "mb-3",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "text-sm font-bold text-gray-900 uppercase tracking-wider",
                children: "Log History"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-xs text-gray-500 mt-1",
                children: "Select a date to view past logs"
              })]
            }), /* @__PURE__ */ jsx(MiniCalendar, {
              selectedDate: logDate,
              onDateChange: (date) => {
                setLogDate(date);
                setCurrentPage("dashboard");
              }
            })]
          }), /* @__PURE__ */ jsx("hr", {
            className: "border-gray-200"
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-sm font-bold text-gray-900 uppercase tracking-wider mb-3",
              children: "Quick Actions"
            }), /* @__PURE__ */ jsx(QuickActions, {
              currentPage,
              onNavigate: (page) => {
                setCurrentPage(page);
                if (page !== "dashboard") {
                  setLogDate(/* @__PURE__ */ new Date());
                }
              }
            })]
          })]
        })
      })]
    }), /* @__PURE__ */ jsx(ActivityModal, {
      isOpen: showModal,
      title: modalContent.title,
      message: modalContent.message,
      onClose: closeModal
    })]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: adminPanel
}, Symbol.toStringTag, { value: "Module" }));
async function findLinkedStudents(guardianId) {
  const linkedStudents = /* @__PURE__ */ new Map();
  const byGuardianId = await getDocs(query(collection(db, "students"), where("guardianId", "==", guardianId)));
  byGuardianId.docs.forEach((studentDoc) => {
    linkedStudents.set(studentDoc.id, {
      id: studentDoc.id,
      ...studentDoc.data()
    });
  });
  return Array.from(linkedStudents.values()).sort((a, b) => {
    const aCreatedAt = typeof a.createdAt === "number" ? a.createdAt : 0;
    const bCreatedAt = typeof b.createdAt === "number" ? b.createdAt : 0;
    if (aCreatedAt !== bCreatedAt) return aCreatedAt - bCreatedAt;
    return (a.name || "").localeCompare(b.name || "");
  });
}
const userPanel = withComponentProps(function UserPanel() {
  const [user, setUser] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      var _a, _b;
      if (!firebaseUser) {
        setLoading(false);
        navigate("/", {
          replace: true
        });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!snap.exists()) {
          setLoading(false);
          navigate("/", {
            replace: true
          });
          return;
        }
        const data = snap.data();
        const normalizedRole = (_a = data.role) == null ? void 0 : _a.toLowerCase();
        if (normalizedRole !== "staff" && normalizedRole !== "parent") {
          setLoading(false);
          navigate("/", {
            replace: true
          });
          return;
        }
        localStorage.setItem("role", normalizedRole);
        const normalizedUserEmail = typeof data.email === "string" && data.email.trim() ? data.email.trim().toLowerCase() : (_b = firebaseUser.email) == null ? void 0 : _b.trim().toLowerCase();
        localStorage.setItem("username", data.displayName || data.name || firebaseUser.email || "User");
        const profile = {
          name: data.name,
          displayName: data.displayName,
          role: normalizedRole,
          email: normalizedUserEmail ?? firebaseUser.email ?? data.email,
          phone: data.phone,
          serial: data.serial,
          status: data.status,
          joined: data.joined,
          createdAt: data.createdAt,
          studentName: data.studentName
        };
        if (normalizedRole === "parent") {
          const studentRecords = await findLinkedStudents(firebaseUser.uid);
          setLinkedStudents(studentRecords);
          setSelectedStudentId((currentStudentId) => {
            var _a2;
            return currentStudentId && studentRecords.some((studentRecord) => studentRecord.id === currentStudentId) ? currentStudentId : ((_a2 = studentRecords[0]) == null ? void 0 : _a2.id) ?? null;
          });
        } else {
          setLinkedStudents([]);
          setSelectedStudentId(null);
        }
        setUser(profile);
        setError(null);
      } catch (err) {
        console.error("UserPanel failed to load profile:", err);
        if ((err == null ? void 0 : err.code) === "permission-denied") {
          setError("Your parent account is signed in, but Firestore is blocking access to linked student records. Publish the latest Firestore rules and confirm each student is linked by guardianId.");
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
    navigate("/", {
      replace: true
    });
  };
  const displayName = (user == null ? void 0 : user.displayName) || (user == null ? void 0 : user.name) || (user == null ? void 0 : user.email) || "User";
  const isParent = (user == null ? void 0 : user.role) === "parent";
  const student = (selectedStudentId ? linkedStudents.find((linkedStudent) => linkedStudent.id === selectedStudentId) : linkedStudents[0]) ?? linkedStudents[0] ?? null;
  const hasMultipleLinkedStudents = linkedStudents.length > 1;
  const walletBalance = Number((student == null ? void 0 : student.balance) ?? 0);
  const dailyLimit = typeof (student == null ? void 0 : student.dailyLimit) === "number" ? student.dailyLimit : null;
  const studentName = (student == null ? void 0 : student.name) || (user == null ? void 0 : user.studentName) || "No linked student found";
  const studentInitial = studentName.trim().charAt(0).toUpperCase() || "S";
  const joinedLabel = (user == null ? void 0 : user.joined) || (typeof (user == null ? void 0 : user.createdAt) === "number" ? new Date(user.createdAt).toLocaleDateString("en-PH") : "-");
  if (loading) {
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen flex items-center justify-center bg-gray-50",
      children: /* @__PURE__ */ jsx("p", {
        className: "text-gray-500",
        children: "Loading..."
      })
    });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen flex items-center justify-center bg-gray-50 p-6",
      children: /* @__PURE__ */ jsxs("div", {
        className: "w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-lg font-semibold text-gray-900",
          children: "Profile Error"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-2 text-sm text-gray-500",
          children: error
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/", {
            replace: true
          }),
          className: "mt-4 rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800",
          children: "Back to Login"
        })]
      })
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsxs("header", {
      className: "bg-[#8B0000] text-white px-6 py-4 flex items-center justify-between",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-xl font-bold",
          children: "EDUTAP"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-sm opacity-80",
          children: "St. Clare College of Caloocan"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex items-center gap-4",
        children: [/* @__PURE__ */ jsxs("span", {
          className: "text-sm",
          children: [user == null ? void 0 : user.email, " ", /* @__PURE__ */ jsxs("span", {
            className: "opacity-70 capitalize",
            children: ["(", user == null ? void 0 : user.role, ")"]
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: handleLogout,
          className: "px-4 py-2 border border-white rounded-lg text-sm hover:bg-white hover:text-[#8B0000] transition-colors",
          children: "Logout"
        })]
      })]
    }), /* @__PURE__ */ jsx("main", {
      className: "p-8 max-w-2xl mx-auto",
      children: /* @__PURE__ */ jsxs("div", {
        className: "space-y-6",
        children: [isParent && /* @__PURE__ */ jsxs("div", {
          className: "rounded-lg border border-red-100 bg-gradient-to-r from-red-950 to-red-900 p-6 text-white",
          children: [hasMultipleLinkedStudents && /* @__PURE__ */ jsxs("div", {
            className: "mb-5 flex justify-end",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "linked-student",
              className: "sr-only",
              children: "Student"
            }), /* @__PURE__ */ jsx("select", {
              id: "linked-student",
              value: (student == null ? void 0 : student.id) ?? "",
              onChange: (event) => setSelectedStudentId(event.target.value),
              className: "max-w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none backdrop-blur-sm focus:ring-2 focus:ring-white/50",
              children: linkedStudents.map((linkedStudent) => /* @__PURE__ */ jsx("option", {
                value: linkedStudent.id,
                className: "text-gray-900",
                children: linkedStudent.name || "Unnamed student"
              }, linkedStudent.id))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col gap-6 md:flex-row md:items-center md:justify-between",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-sm uppercase tracking-[0.18em] text-red-100/80",
                children: "Student Wallet"
              }), /* @__PURE__ */ jsxs("h2", {
                className: "mt-3 text-4xl font-bold",
                children: ["PHP", " ", walletBalance.toLocaleString("en-PH", {
                  minimumFractionDigits: 2
                })]
              }), dailyLimit !== null && /* @__PURE__ */ jsxs("p", {
                className: "mt-2 text-xs text-red-200",
                children: ["Daily limit: PHP", " ", dailyLimit.toLocaleString("en-PH", {
                  minimumFractionDigits: 2
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-xl font-bold text-white",
                children: (student == null ? void 0 : student.photoUrl) ? /* @__PURE__ */ jsx("img", {
                  src: student.photoUrl,
                  alt: studentName,
                  className: "h-full w-full object-cover"
                }) : /* @__PURE__ */ jsx("span", {
                  children: studentInitial
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "truncate text-lg font-semibold text-white",
                  children: studentName
                }), /* @__PURE__ */ jsxs("p", {
                  className: "mt-1 text-sm text-red-100",
                  children: ["LRN: ", (student == null ? void 0 : student.lrn) || "-"]
                }), (student == null ? void 0 : student.gradeLevel) && /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-red-200",
                  children: student.gradeLevel
                })]
              })]
            })]
          })]
        }), isParent && !student && /* @__PURE__ */ jsxs("div", {
          className: "rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900",
          children: [/* @__PURE__ */ jsx("p", {
            className: "font-semibold",
            children: "Student link still needs attention"
          }), /* @__PURE__ */ jsxs("p", {
            className: "mt-1",
            children: ["This parent account signed in successfully, but no linked student records could be loaded yet. Check that each matching", " ", /* @__PURE__ */ jsx("code", {
              children: "students"
            }), " document has this parent's", " ", /* @__PURE__ */ jsx("code", {
              children: "guardianId"
            }), ", and that the latest Firestore rules are published."]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg border border-gray-200 p-8",
          children: [/* @__PURE__ */ jsxs("h2", {
            className: "text-2xl font-semibold mb-1",
            children: ["Welcome, ", displayName, "!"]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-gray-500 mb-6",
            children: isParent ? "Here's your parent profile." : "Here's your staff profile."
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between border-b pb-3",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Full Name"
              }), /* @__PURE__ */ jsx("span", {
                className: "font-medium",
                children: displayName
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between border-b pb-3",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Email"
              }), /* @__PURE__ */ jsx("span", {
                className: "font-medium",
                children: user == null ? void 0 : user.email
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between border-b pb-3",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Role"
              }), /* @__PURE__ */ jsx("span", {
                className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize",
                children: user == null ? void 0 : user.role
              })]
            }), isParent && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between border-b pb-3",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-gray-500",
                  children: "Student"
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-medium",
                  children: (student == null ? void 0 : student.name) || (user == null ? void 0 : user.studentName) || "-"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between border-b pb-3",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-gray-500",
                  children: "Grade Level"
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-medium",
                  children: (student == null ? void 0 : student.gradeLevel) || "-"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between border-b pb-3",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-gray-500",
                  children: "LRN"
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-medium",
                  children: (student == null ? void 0 : student.lrn) || "-"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between border-b pb-3",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-gray-500",
                  children: "RFID"
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-mono text-blue-600",
                  children: (student == null ? void 0 : student.rfidSerial) || "-"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between border-b pb-3",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-gray-500",
                  children: "School Email"
                }), /* @__PURE__ */ jsx("span", {
                  className: "font-medium",
                  children: (student == null ? void 0 : student.schoolEmail) || "-"
                })]
              })]
            }), (user == null ? void 0 : user.serial) && /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between border-b pb-3",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Serial"
              }), /* @__PURE__ */ jsx("span", {
                className: "font-mono text-blue-600",
                children: user.serial
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between border-b pb-3",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Phone"
              }), /* @__PURE__ */ jsx("span", {
                className: "font-medium",
                children: (user == null ? void 0 : user.phone) || (student == null ? void 0 : student.contactNumber) || "-"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between border-b pb-3",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Status"
              }), /* @__PURE__ */ jsx("span", {
                className: `px-3 py-1 rounded-full text-sm ${((user == null ? void 0 : user.status) || (student == null ? void 0 : student.status)) === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`,
                children: (user == null ? void 0 : user.status) || (student == null ? void 0 : student.status) || "-"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-gray-500",
                children: "Joined"
              }), /* @__PURE__ */ jsx("span", {
                className: "font-medium",
                children: joinedLabel
              })]
            })]
          })]
        })]
      })
    })]
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: userPanel
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-D0-v9gIb.js", "imports": ["/assets/chunk-KNED5TY2-Z6pi19hz.js", "/assets/index-B8Xcz9aw.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BtclHa0j.js", "imports": ["/assets/chunk-KNED5TY2-Z6pi19hz.js", "/assets/index-B8Xcz9aw.js", "/assets/firebase-1YoYmofK.js", "/assets/branding-DOpZtqS6.js"], "css": ["/assets/root-Bk4HZJrB.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login-page": { "id": "routes/login-page", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-page-Bm9l2yat.js", "imports": ["/assets/firebase-1YoYmofK.js", "/assets/chunk-KNED5TY2-Z6pi19hz.js", "/assets/branding-DOpZtqS6.js", "/assets/circle-alert-D3B74p21.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin-panel": { "id": "routes/admin-panel", "parentId": "root", "path": "/admin-panel", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/admin-panel-Cb2lpjvQ.js", "imports": ["/assets/firebase-1YoYmofK.js", "/assets/chunk-KNED5TY2-Z6pi19hz.js", "/assets/index-B8Xcz9aw.js", "/assets/circle-alert-D3B74p21.js", "/assets/branding-DOpZtqS6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/user-panel": { "id": "routes/user-panel", "parentId": "root", "path": "/user-panel", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/user-panel-CgS0fFQf.js", "imports": ["/assets/firebase-1YoYmofK.js", "/assets/chunk-KNED5TY2-Z6pi19hz.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "parent-dashboard": { "id": "parent-dashboard", "parentId": "root", "path": "/parent-dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/user-panel-CgS0fFQf.js", "imports": ["/assets/firebase-1YoYmofK.js", "/assets/chunk-KNED5TY2-Z6pi19hz.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-2fb7aa9a.js", "version": "2fb7aa9a", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/login-page": {
    id: "routes/login-page",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/admin-panel": {
    id: "routes/admin-panel",
    parentId: "root",
    path: "/admin-panel",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/user-panel": {
    id: "routes/user-panel",
    parentId: "root",
    path: "/user-panel",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "parent-dashboard": {
    id: "parent-dashboard",
    parentId: "root",
    path: "/parent-dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routes,
  ssr
};
