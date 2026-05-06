import { sendPasswordResetEmail } from "firebase/auth";
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/configs/firebase";

const USERS_COLLECTION = "users";
const ARCHIVES_COLLECTION = "archives";
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

export async function adminUpdateUserEmail(uid: string, correctedEmail: string) {
	const normalizedUid = uid.trim();
	const normalizedEmail = normalizeEmail(correctedEmail);

	if (!normalizedUid) {
		throw new Error("A valid UID is required.");
	}
	if (!normalizedEmail) {
		throw new Error("A valid corrected email is required.");
	}

	await updateDoc(doc(db, USERS_COLLECTION, normalizedUid), {
		email: normalizedEmail,
	});
	await sendPasswordResetEmail(auth, normalizedEmail);
}

export async function archiveDocument(collectionName: string, docId: string) {
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
		uid:
			typeof sourceData.uid === "string" && sourceData.uid.trim().length > 0
				? sourceData.uid
				: normalizedDocId,
		originalCollection: normalizedCollection,
		originalDocId: normalizedDocId,
		archivedAt: serverTimestamp(),
		deleteAt: new Date(Date.now() + THIRTY_DAYS_IN_MS),
	});
	await deleteDoc(sourceRef);
}

export async function restoreDocument(docId: string) {
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
	const originalDocId =
		typeof archiveData.originalDocId === "string" && archiveData.originalDocId.trim().length > 0
			? archiveData.originalDocId
			: normalizedDocId;

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
		uid:
			typeof restoredData.uid === "string" && restoredData.uid.trim().length > 0
				? restoredData.uid
				: originalDocId,
	});
	await deleteDoc(archiveRef);
}

export async function deleteArchivedDocument(docId: string) {
	const normalizedDocId = docId.trim();
	if (!normalizedDocId) {
		throw new Error("A valid document ID is required.");
	}

	await deleteDoc(doc(db, ARCHIVES_COLLECTION, normalizedDocId));
}

export async function archiveUser(uid: string) {
	await archiveDocument(USERS_COLLECTION, uid);
}

export async function restoreUser(uid: string) {
	await restoreDocument(uid);
}

export async function getArchiveCollectionNames() {
	const snapshot = await getDocs(collection(db, ARCHIVES_COLLECTION));
	const collectionNames = new Set<string>();
	snapshot.forEach((archiveDoc) => {
		const data = archiveDoc.data();
		if (typeof data.originalCollection === "string" && data.originalCollection.trim()) {
			collectionNames.add(data.originalCollection);
		}
	});
	return Array.from(collectionNames).sort((a, b) => a.localeCompare(b));
}
