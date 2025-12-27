'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DepartmentsClient from '../departments/DepartmentsClient';

export default function DepartmentsTab() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch('/api/departments');
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (res.status === 403) {
                router.push('/dashboard');
                return;
            }
            const data = await res.json();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading departments...</p>
                </div>
            </div>
        );
    }

    return <DepartmentsClient departments={departments} />;
}
