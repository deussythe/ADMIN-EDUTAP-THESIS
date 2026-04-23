"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";

interface AdminPrimaryButtonProps {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	type?: "button" | "submit" | "reset";
}

export function AdminPrimaryButton({
	children,
	onClick,
	disabled = false,
	className = "",
	type = "button",
}: AdminPrimaryButtonProps) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-950 px-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${className}`}>
			<Plus className="h-4 w-4 shrink-0" />
			<span>{children}</span>
		</button>
	);
}
