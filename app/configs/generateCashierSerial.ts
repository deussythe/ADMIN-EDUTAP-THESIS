import { doc, runTransaction } from "firebase/firestore";
import { db } from "app/configs/firebase"; // your firebase init file

export async function generateCashierSerial(): Promise<string> {
    const counterRef = doc(db, "counters", "cashier");

    const newSerial = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);

        let nextNumber = 1;

        if (counterSnap.exists()) {
            nextNumber = (counterSnap.data().current ?? 0) + 1;
        }

        transaction.set(counterRef, { current: nextNumber });

        return `CSR-${String(nextNumber).padStart(3, "0")}`;
    });

    return newSerial; // e.g. "CSR-001"
}