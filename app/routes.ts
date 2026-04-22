import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/login-page.tsx"),
	route("/admin-panel", "routes/admin-panel.tsx"),
	route("/user-panel", "routes/user-panel.tsx"),
	route("/parent-dashboard", "routes/user-panel.tsx", { id: "parent-dashboard" }),
	
] satisfies RouteConfig;