// Existing export... (I will append or overwrite meaningfully if I can, but multi_replace is better for appending. 
// Actually I'll just create a new file for these mocks to avoid reading/sed-ing the existing file too much)

export const CONTRACTS_MOCK = [
    { id: 1, title: 'Office Lease Agreement', partner: 'School Property Co.', type: 'Lease', value: '$120,000/yr', startDate: '2025-01-01', endDate: '2027-12-31', status: 'Active' },
    { id: 2, title: 'Internet Service (Fiber)', partner: 'True Corp', type: 'Service', value: '$2,500/mo', startDate: '2025-01-01', endDate: '2025-12-31', status: 'Active' },
    { id: 3, title: 'CCTV Maintenance', partner: 'Secure Systems Ltd.', type: 'MA', value: '$5,000/yr', startDate: '2024-06-01', endDate: '2025-05-31', status: 'Expiring Soon' },
];

export const USERS_MOCK = [
    { id: 1, name: 'Somchai Jaidee', email: 'somchai@school.ac.th', role: 'Admin', department: 'IT', status: 'Active' },
    { id: 2, name: 'Alice Teacher', email: 'alice@school.ac.th', role: 'User', department: 'Science', status: 'Active' },
    { id: 3, name: 'Bob Technician', email: 'bob@school.ac.th', role: 'Technician', department: 'IT Support', status: 'Active' },
];
