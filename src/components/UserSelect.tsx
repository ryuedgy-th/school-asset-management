'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Building2 } from 'lucide-react';

interface User {
    id: number;
    name: string | null;
    email: string | null;
    department: string | null;
    role: string;
}

interface UserSelectProps {
    onSelect: (userId: number) => void;
    label?: string;
}

export default function UserSelect({ onSelect, label = "Select User" }: UserSelectProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [departments, setDepartments] = useState<string[]>([]);

    // Load all users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const { getAllUsers } = await import('@/app/lib/actions');
                const allUsers = await getAllUsers();
                setUsers(allUsers);
                setFilteredUsers(allUsers);

                // Extract unique departments
                const uniqueDepts = Array.from(new Set(
                    allUsers
                        .map(u => u.department)
                        .filter(Boolean)
                )) as string[];
                setDepartments(uniqueDepts.sort());
            } catch (error) {
                console.error('Failed to load users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Filter users based on search and department
    useEffect(() => {
        let filtered = users;

        // Department filter
        if (departmentFilter !== 'all') {
            filtered = filtered.filter(u => u.department === departmentFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.department?.toLowerCase().includes(query)
            );
        }

        setFilteredUsers(filtered);
    }, [searchQuery, departmentFilter, users]);

    if (selectedUser) {
        return (
            <div className="flex justify-between items-center p-4 border-2 rounded-xl bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="font-semibold text-blue-900">{selectedUser.name}</div>
                        <div className="text-sm text-blue-700">{selectedUser.email}</div>
                        {selectedUser.department && (
                            <div className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                                <Building2 size={12} />
                                {selectedUser.department}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => { setSelectedUser(null); onSelect(0); setSearchQuery(''); setDepartmentFilter('all'); }}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or department..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            {/* Department Filter */}
            {departments.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => setDepartmentFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${departmentFilter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        All Departments
                    </button>
                    {departments.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setDepartmentFilter(dept)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${departmentFilter === dept
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            )}

            {/* User List */}
            <div className="border-2 border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading users...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <div className="font-medium">No users found</div>
                        <div className="text-sm">Try adjusting your search or filter</div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => { setSelectedUser(user); onSelect(user.id); }}
                                className="w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-blue-600 text-slate-600 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                                    {user.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-800 truncate">{user.name || 'Unnamed User'}</div>
                                    <div className="text-sm text-slate-500 truncate">{user.email || 'No email'}</div>
                                    {user.department && (
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Building2 size={12} />
                                            {user.department}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                                    {user.role}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results count */}
            {!loading && filteredUsers.length > 0 && (
                <div className="text-xs text-slate-500 text-center">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            )}
        </div>
    );
}
