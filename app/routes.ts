import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	index("routes/login-page.tsx"),
	route("/admin-panel", "routes/admin-panel.tsx"),
] satisfies RouteConfig;
