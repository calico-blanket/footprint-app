import { db } from "./firebase";
import { PostingArea, Record } from "./types";
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

export const postingAreaConverter: FirestoreDataConverter<PostingArea> = {
    toFirestore(area: PostingArea) {
        return { ...area };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): PostingArea {
        const data = snapshot.data(options);
        return { ...data, id: snapshot.id } as PostingArea;
    }
};

export const getPostingAreasCollection = () =>
    collection(db, "posting_areas").withConverter(postingAreaConverter);

