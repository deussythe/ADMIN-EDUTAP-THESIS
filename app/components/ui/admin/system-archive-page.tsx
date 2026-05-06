"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, Trash2 } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/configs/firebase";
import { deleteArchivedDocument, restoreDocument } from "@/configs/adminUserService";
import { SystemDialog } from "@/components/ui/admin/system-dialog";

interface ArchiveRecord {
	id: string;
	displayName?: string;
	email?: string;
	uid?: string;
	originalCollection?: string;
	originalDocId?: string;
	archivedAt?: unknown;
	deleteAt?: unknown;
}

interface DialogState {
	isOpen: boolean;
	title: string;
	message: string;
	variant: "info" | "success" | "danger";
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm?: () => void;
}

function toDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (typeof value === "object") {
		if ("toDate" in value && typeof value.toDate === "function") {
			return value.toDate();
		}
		if ("seconds" in value && typeof value.seconds === "number") {
			return new Date(value.seconds * 1000);
		}
	}
	return null;
}

function formatDate(value: unknown) {
	const parsed = toDate(value);
	return parsed
		? parsed.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: "-";
}

export function SystemArchivePage() {
	const [archives, setArchives] = useState<ArchiveRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [archiveSearch, setArchiveSearch] = useState("");
	const [dialog, setDialog] = useState<DialogState>({
		isOpen: false,
		title: "",
		message: "",
		variant: "info",
		confirmLabel: "OK",
	});

	const closeDialog = () =>
		setDialog((current) => ({
			...current,
			isOpen: false,
			onConfirm: undefined,
		}));

	const showNotice = (
		title: string,
		message: string,
		variant: "info" | "success" | "danger" = "info",
	) => {
		setDialog({
			isOpen: true,
			title,
			message,
			variant,
			confirmLabel: "Got it",
		});
	};

	const showConfirm = (
		title: string,
		message: string,
		onConfirm: () => void,
		confirmLabel = "Continue",
	) => {
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
			},
		});
	};

	useEffect(() => {
		const unsubscribeArchives = onSnapshot(
			collection(db, "archives"),
			(snapshot) => {
				const data: ArchiveRecord[] = snapshot.docs.map((snapshotDoc) => ({
					id: snapshotDoc.id,
					...(snapshotDoc.data() as Omit<ArchiveRecord, "id">),
				}));
				setArchives(data);
				setLoading(false);
			},
			(err) => {
				console.error("Archives listener failed:", err.message);
				showNotice("Archive Load Failed", err.message, "danger");
				setLoading(false);
			},
		);

		return () => {
			unsubscribeArchives();
		};
	}, []);

	const filteredArchives = useMemo(() => {
		const term = archiveSearch.toLowerCase();
		return archives.filter(
			(archive) =>
				archive.id.toLowerCase().includes(term) ||
				(archive.displayName ?? "").toLowerCase().includes(term) ||
				(archive.email ?? "").toLowerCase().includes(term) ||
				(archive.originalCollection ?? "").toLowerCase().includes(term),
		);
	}, [archives, archiveSearch]);

	const handleRestore = (archiveId: string) => {
		showConfirm(
			"Restore Document",
			"Restore this archived document back to its original collection?",
			() => {
				void (async () => {
					try {
						await restoreDocument(archiveId);
						showNotice("Restored", "Document restored successfully.", "success");
					} catch (err: any) {
						showNotice("Restore Failed", err.message, "danger");
					}
				})();
			},
			"Restore",
		);
	};

	const handleDelete = (archiveId: string) => {
		showConfirm(
			"Delete Archived Document",
			"This permanently deletes the archived record. Continue?",
			() => {
				void (async () => {
					try {
						await deleteArchivedDocument(archiveId);
						showNotice("Deleted", "Archived document permanently deleted.", "success");
					} catch (err: any) {
						showNotice("Delete Failed", err.message, "danger");
					}
				})();
			},
			"Delete",
		);
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
				Loading archives...
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				<div className="bg-white rounded-lg border border-gray-200 p-8">
					<h2 className="text-2xl font-semibold mb-2">System Archive</h2>
					<p className="text-gray-600">
						Archived records are shown here. Use Restore or Delete for each item.
					</p>
				</div>

				<div className="bg-white rounded-lg border border-gray-200 p-8">
					<div className="mb-6 flex items-center justify-between gap-4">
						<div>
							<h3 className="text-xl font-semibold">Archives Collection</h3>
							<p className="text-sm text-gray-500">
								Records archived from active collections.
							</p>
						</div>
					</div>

					<div className="relative mb-6 max-w-sm">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Search archives..."
							value={archiveSearch}
							onChange={(event) => setArchiveSearch(event.target.value)}
							className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
						/>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Archive ID</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Original Collection</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Identity</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Window</th>
									<th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredArchives.length === 0 ? (
									<tr>
										<td colSpan={5} className="text-center py-8 text-gray-400">
											No archived documents found.
										</td>
									</tr>
								) : (
									filteredArchives.map((archive) => (
										<tr key={archive.id} className="border-b border-gray-100 hover:bg-gray-50">
											<td className="py-4 px-4 text-xs font-mono text-gray-700">{archive.id}</td>
											<td className="py-4 px-4 text-sm text-gray-700">
												{archive.originalCollection || "-"}
											</td>
											<td className="py-4 px-4 text-sm text-gray-700">
												<div>{archive.displayName || "-"}</div>
												<div className="text-xs text-gray-500">{archive.email || archive.uid || "-"}</div>
											</td>
											<td className="py-4 px-4 text-sm text-gray-700">
												<div>Archived: {formatDate(archive.archivedAt)}</div>
												<div className="text-xs text-gray-500">
													Delete after: {formatDate(archive.deleteAt)}
												</div>
											</td>
											<td className="py-4 px-4">
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() => handleRestore(archive.id)}
														className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
														<RotateCcw className="h-3.5 w-3.5" />
														Restore
													</button>
													<button
														type="button"
														onClick={() => handleDelete(archive.id)}
														className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">
														<Trash2 className="h-3.5 w-3.5" />
														Delete
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<SystemDialog
				isOpen={dialog.isOpen}
				title={dialog.title}
				message={dialog.message}
				variant={dialog.variant}
				confirmLabel={dialog.confirmLabel}
				cancelLabel={dialog.cancelLabel}
				onClose={closeDialog}
				onConfirm={dialog.onConfirm}
			/>
		</>
	);
}
