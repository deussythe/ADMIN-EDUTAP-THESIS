const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.adminUpdateUserEmail = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in to perform this action.");
  }

  const callerSnapshot = await admin.firestore().doc(`users/${auth.uid}`).get();
  const callerRole = String(callerSnapshot.data()?.role ?? "").trim().toLowerCase();
  if (callerRole !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can update user emails.");
  }

  const uid = String(data?.uid ?? "").trim();
  const normalizedEmail = String(data?.newEmail ?? "").trim().toLowerCase();

  if (!uid) {
    throw new HttpsError("invalid-argument", "A valid target uid is required.");
  }

  if (!normalizedEmail) {
    throw new HttpsError("invalid-argument", "A valid newEmail is required.");
  }

  try {
    await admin.auth().updateUser(uid, { email: normalizedEmail });
    await admin.firestore().doc(`users/${uid}`).set(
      { email: normalizedEmail },
      { merge: true },
    );

    return {
      success: true,
      uid,
      email: normalizedEmail,
      message: "Email updated in Authentication and Firestore.",
    };
  } catch (error) {
    logger.error("adminUpdateUserEmail failed", {
      callerUid: auth.uid,
      targetUid: uid,
      error,
    });

    switch (error?.code) {
      case "auth/invalid-email":
        throw new HttpsError("invalid-argument", "Invalid email format.");
      case "auth/user-not-found":
        throw new HttpsError("not-found", "Target user was not found.");
      case "auth/email-already-exists":
        throw new HttpsError("already-exists", "That email is already in use.");
      default:
        throw new HttpsError("internal", "Unable to update user email.");
    }
  }
});
