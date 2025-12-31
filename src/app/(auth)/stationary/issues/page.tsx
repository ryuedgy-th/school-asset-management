import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default async function StationaryIssuesPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user || !hasModuleAccess(user, 'stationary')) {
        redirect('/');
    }

    // Fetch issues
    const issues = await prisma.stationaryIssue.findMany({
        include: {
            issuedBy: { select: { id: true, name: true } },
            issuedTo: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            location: { select: { id: true, code: true, name: true } },
            items: {
                include: {
                    item: { select: { id: true, itemCode: true, name: true, uom: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/stationary"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/90 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Stationary
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <FileText className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Issues</h1>
                            <p className="text-slate-500 mt-1">Stationary item distribution records</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Issue No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Issued To</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Items</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {issues.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            No issues found
                                        </td>
                                    </tr>
                                ) : (
                                    issues.map((issue) => (
                                        <tr key={issue.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm">{issue.issueNo}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{issue.issuedTo.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{issue.department.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{issue.location.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold">{issue.items.length} items</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{new Date(issue.createdAt).toLocaleDateString('th-TH')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    issue.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
