import RequestTable from '@/components/RequestTable';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Borrow Requests | AssetMaster',
};

export default function RequestsPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Borrow Requests</h1>
                <p className="text-gray-500 mt-1">Manage asset approval and returns</p>
            </div>

            <RequestTable />
        </div>
    );
}
