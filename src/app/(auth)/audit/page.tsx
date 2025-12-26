import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { format } from 'date-fns';
import { Shield, Search, ArrowUpRight } from 'lucide-react';

export default async function AuditLogsPage() {
    const session = await auth();
    // In a real app, strict RBAC check here
    if (!session?.user) return notFound();

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: true },
        take: 100
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Shield className="text-primary" size={32} />
                        Audit Logs
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Track system activities and security events.
                    </p>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-[180px]">Timestamp</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-[120px]">Actor</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-[120px]">Action</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-[120px]">Entity</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                        {format(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {log.user?.name || `User #${log.userId}`}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {log.user?.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${log.action.includes('DELETE') ? 'bg-red-50 text-red-700 border border-red-100' :
                                                log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                    log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                        'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="font-medium">{log.entity}</span>
                                            <span className="text-slate-300">#</span>
                                            <span className="font-mono text-xs">{log.entityId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.details && (
                                            <pre className="text-[10px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-600 max-w-[300px] overflow-auto max-h-[100px]">
                                                {JSON.stringify(JSON.parse(log.details), null, 2)}
                                            </pre>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No audit logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
