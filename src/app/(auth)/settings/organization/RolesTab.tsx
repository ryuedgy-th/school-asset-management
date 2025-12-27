'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RolesClient from '../roles/RolesClient';

export default function RolesTab() {
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch roles
            const rolesRes = await fetch('/api/roles');
            if (rolesRes.status === 401) {
                router.push('/login');
                return;
            }
            if (rolesRes.status === 403) {
                router.push('/dashboard');
                return;
            }
            const rolesData = await rolesRes.json();
            setRoles(rolesData);

            // Fetch departments
            const depsRes = await fetch('/api/departments');
            const depsData = await depsRes.json();
            setDepartments(depsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading roles...</p>
                </div>
            </div>
        );
    }

    return <RolesClient roles={roles} departments={departments} />;
}
