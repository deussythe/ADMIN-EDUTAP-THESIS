import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "./firebase";

export type AuditTargetType = "student" | "staff" | "user" | "topup" | "transaction";

interface AuditLogInput {
	action: string;
	targetType: AuditTargetType;
	targetId: string;
	targetName: string;
	details: unknown;
	notificationTitle?: string;
	notificationMessage?: string;
	notificationType?: string;
	notifyAdmin?: boolean;
}

function getDefaultNotificationTitle(targetType: AuditTargetType, action: string) {
	switch (targetType) {
		case "topup":
			return `Top-up ${action}`;
		case "transaction":
			return `Transaction ${action}`;
		default:
			return `Account ${action}`;
	}
}

export const writeAccountAuditLog = async ({
	action,
	targetType,
	targetId,
	targetName,
	details,
	notificationTitle,
	notificationMessage,
	notificationType = "general",
	notifyAdmin = true,
}: AuditLogInput) => {
	const actor = auth.currentUser;
	const actorLabel = actor?.displayName || actor?.email || "Unknown user";
	const timestamp = Date.now();

	await addDoc(collection(db, "audit_logs"), {
		action,
		targetType,
		targetId,
		targetName,
		details,
		actorId: actor?.uid ?? null,
		actorLabel,
		timestamp,
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
			actorId: actor?.uid ?? null,
			actorLabel,
		});
	} catch (error: any) {
		if (error?.code !== "permission-denied") {
			throw error;
		}
	}
};
