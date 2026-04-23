import { Home, Plus, Users, Settings, UserPlus, CreditCard } from "lucide-react";

type PageType = "dashboard" | "products" | "staff" | "users" | "reports" | "settings" | "topups";

interface QuickActionsProps {
	currentPage: PageType;
	onNavigate: (page: PageType) => void;
}

export function QuickActions({ currentPage, onNavigate }: QuickActionsProps) {
	return (
		<div className="settings-enter settings-delay-4 mb-8">
			<div className="grid grid-cols-2 gap-3">
				<button
					onClick={() => onNavigate("dashboard")}
					className={`admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${
						currentPage === "dashboard"
							? "border-red-200 bg-red-50 text-red-950 shadow-md"
							: "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"
					}`}>
					<Home className="w-6 h-6 mb-2" />
					<span className="text-sm">Dashboard</span>
				</button>

				<button
					onClick={() => onNavigate("products")}
					className={`admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${
						currentPage === "products"
							? "border-red-200 bg-red-50 text-red-950 shadow-md"
							: "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"
					}`}>
					<Plus className="w-6 h-6 mb-2" />
					<span className="text-sm">Products</span>
				</button>

				<button
					onClick={() => onNavigate("staff")}
					className={`admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${
						currentPage === "staff"
							? "border-red-200 bg-red-50 text-red-950 shadow-md"
							: "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"
					}`}>
					<Users className="w-6 h-6 mb-2" />
					<span className="text-sm">Staff</span>
				</button>

				<button
					onClick={() => onNavigate("users")}
					className={`admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${
						currentPage === "users"
							? "border-red-200 bg-red-50 text-red-950 shadow-md"
							: "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"
					}`}>
					<UserPlus className="w-6 h-6 mb-2" />
					<span className="text-sm">Users</span>
				</button>

				<button
					onClick={() => onNavigate("topups")}
					className={`admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${
						currentPage === "topups"
							? "border-red-200 bg-red-50 text-red-950 shadow-md"
							: "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"
					}`}>
					<CreditCard className="w-6 h-6 mb-2" />
					<span className="text-sm">Manage Top-Ups</span>
				</button>

				<button
					onClick={() => onNavigate("settings")}
					className={`admin-interactive flex flex-col items-center justify-center rounded-2xl border p-4 text-sm font-medium shadow-sm ${
						currentPage === "settings"
							? "border-red-200 bg-red-50 text-red-950 shadow-md"
							: "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50/40"
					}`}>
					<Settings className="w-6 h-6 mb-2" />
					<span className="text-sm">Settings</span>
				</button>
			</div>
		</div>
	);
}
