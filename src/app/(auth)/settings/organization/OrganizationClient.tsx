'use client';

import { useState } from 'react';
import { Building2, Shield } from 'lucide-react';
import DepartmentsTab from './DepartmentsTab';
import RolesTab from './RolesTab';

interface Department {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
    _count: {
        users: number;
        roles: number;
        assets: number;
        inspections: number;
    };
}

interface Role {
    id: number;
    name: string;
    departmentId: number | null;
    department: { id: number; code: string; name: string } | null;
    scope: string;
    isActive: boolean;
    _count: {
        users: number;
        rolePermissions: number;
    };
}

interface Module {
    id: number;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    icon: string | null;
    routePath: string | null;
    permissions: Array<{
        id: number;
        action: string;
        description: string | null;
    }>;
}

export default function OrganizationClient({
    departments: initialDepartments,
    roles: initialRoles,
    modules,
}: {
    departments: Department[];
    roles: Role[];
    modules: Module[];
}) {
    const [activeTab, setActiveTab] = useState<'departments' | 'roles'>('departments');
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [roles, setRoles] = useState<Role[]>(initialRoles);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/5 to-slate-50 p-4 md:p-8 pt-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20">
                            <Building2 className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Organization</h1>
                            <p className="text-slate-500 mt-1">Manage departments and roles</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit">
                        <button
                            onClick={() => setActiveTab('departments')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'departments'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Building2 size={18} />
                            Departments
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'roles'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Shield size={18} />
                            Roles
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'departments' && (
                        <DepartmentsTab
                            departments={departments}
                            setDepartments={setDepartments}
                        />
                    )}
                    {activeTab === 'roles' && (
                        <RolesTab
                            roles={roles}
                            setRoles={setRoles}
                            departments={departments}
                            modules={modules}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
