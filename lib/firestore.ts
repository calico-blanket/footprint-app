import { db } from "./firebase";
import { Record } from "./types";
import { collection, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

export const recordConverter: FirestoreDataConverter<Record> = {
    toFirestore(record: Record) {
        return { ...record };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Record {
        const data = snapshot.data(options);
        return data as Record;
    }
};

export const getUserRecordsCollection = (userId: string) =>
    collection(db, "users", userId, "records").withConverter(recordConverter);



