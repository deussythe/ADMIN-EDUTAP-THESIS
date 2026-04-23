interface ActivityModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	onClose: () => void;
}

export function ActivityModal({ isOpen, title, message, onClose }: ActivityModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
			<div className="settings-enter w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
				<h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
				<p className="mb-6 text-sm leading-6 text-gray-600">{message}</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200">
						Close
					</button>
					<button
						onClick={onClose}
						className="rounded-xl bg-red-950 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-900 hover:shadow-lg">
						Got it
					</button>
				</div>
			</div>
		</div>
	);
}
