"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import RecordForm from "@/components/RecordForm";
import { doc, getDoc } from "firebase/firestore";
import { getUserRecordsCollection } from "@/lib/firestore";
import { Record } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditRecordPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null;
    const { user } = useAuth();
    const router = useRouter();
    const [record, setRecord] = useState<Record | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            const fetchRecord = async () => {
                try {
                    const docRef = doc(getUserRecordsCollection(user.uid), id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setRecord(docSnap.data());
                    } else {
                        toast.error("Record not found");
                        router.push("/timeline");
                    }
                } catch (error) {
                    console.error("Error fetching record", error);
                    toast.error("Error fetching record");
                } finally {
                    setLoading(false);
                }
            };
            fetchRecord();
        } else if (!user) {
            // Wait for auth
        }
    }, [user, id, router]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!record) return null;

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-center mb-6">Edit Record</h1>
            <RecordForm initialData={record} />
        </div>
    );
}
