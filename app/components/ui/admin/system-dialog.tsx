"use client";

interface SystemDialogProps {
	isOpen: boolean;
	title: string;
	message: string;
	onClose: () => void;
	onConfirm?: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "info" | "success" | "danger";
}

const VARIANT_STYLES = {
	info: {
		badge: "System Notice",
		badgeClass: "bg-red-100 text-red-900",
		confirmClass: "bg-red-950 text-white hover:bg-red-900",
	},
	success: {
		badge: "Success",
		badgeClass: "bg-emerald-100 text-emerald-800",
		confirmClass: "bg-emerald-600 text-white hover:bg-emerald-700",
	},
	danger: {
		badge: "Confirm Action",
		badgeClass: "bg-red-100 text-red-800",
		confirmClass: "bg-red-700 text-white hover:bg-red-800",
	},
} as const;

export function SystemDialog({
	isOpen,
	title,
	message,
	onClose,
	onConfirm,
	confirmLabel = "OK",
	cancelLabel = "Cancel",
	variant = "info",
}: SystemDialogProps) {
	if (!isOpen) return null;

	const styles = VARIANT_STYLES[variant];

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
			<div className="w-full max-w-md overflow-hidden rounded-3xl border border-red-100 bg-white shadow-2xl">
				<div className="bg-gradient-to-r from-red-950 via-red-900 to-red-800 px-6 py-5 text-white">
					<span
						className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${styles.badgeClass}`}>
						{styles.badge}
					</span>
					<h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
				</div>
				<div className="px-6 py-5">
					<p className="text-sm leading-6 text-gray-600">{message}</p>
					<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						{onConfirm ? (
							<button
								type="button"
								onClick={onClose}
								className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
								{cancelLabel}
							</button>
						) : null}
						<button
							type="button"
							onClick={onConfirm ?? onClose}
							className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles.confirmClass}`}>
							{confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
