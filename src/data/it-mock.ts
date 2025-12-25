export const DOMAINS_MOCK = [
    { id: 1, name: 'school-main.com', registrar: 'GoDaddy', expiry: '2025-05-15', ssl: 'Active', sslExpiry: '2025-04-20', autoRenew: true },
    { id: 2, name: 'library-portal.net', registrar: 'Namecheap', expiry: '2024-12-30', ssl: 'Warning', sslExpiry: '2024-12-28', autoRenew: false },
    { id: 3, name: 'student-system.org', registrar: 'Cloudflare', expiry: '2026-01-10', ssl: 'Active', sslExpiry: '2025-11-05', autoRenew: true },
];

export const LICENSES_MOCK = [
    { id: 1, software: 'Microsoft 365 A3', type: 'Subscription', seats: 500, used: 450, expiry: '2025-08-01', cost: '$12,500/yr' },
    { id: 2, software: 'Adobe Creative Cloud', type: 'Subscription', seats: 50, used: 48, expiry: '2025-03-15', cost: '$3,000/yr' },
    { id: 3, software: 'Zoom Education', type: 'Subscription', seats: 100, used: 85, expiry: '2025-06-30', cost: '$1,800/yr' },
    { id: 4, software: 'Windows Server 2022', type: 'Perpetual', seats: 10, used: 8, expiry: '-', cost: '$8,000' },
];
