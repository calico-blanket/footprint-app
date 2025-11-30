import RecordForm from "@/components/RecordForm";

export default function NewRecordPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-center mb-6">New Record</h1>
            <RecordForm />
        </div>
    );
}
