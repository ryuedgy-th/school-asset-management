'use server';

import { logAudit } from '@/lib/logger';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const department = formData.get('department') as string;
    const phoneNumber = formData.get('phoneNumber') as string;

    if (!email || !password || !name) {
        return { error: 'Missing required fields' };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'User',
                department,
                phoneNumber,
            },
        });

        await logAudit('CREATE_USER', 'User', user.id, { name, email, role, department });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Failed to create user:', error);
        return { error: 'Failed to create user. Email might be taken.' };
    }
}

import { headers } from 'next/headers';

// ... existing code

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const email = formData.get('email') as string;

    // Check Rate Limit (5 attempts per 15 mins)
    const recentAttempts = await prisma.loginAttempt.count({
        where: {
            email,
            createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) }
        }
    });

    if (recentAttempts >= 5) {
        return 'Too many login attempts. Please try again in 15 minutes.';
    }

    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    // Record Failed Attempt
                    const headersList = await headers();
                    const ip = headersList.get('x-forwarded-for') || 'unknown';

                    await prisma.loginAttempt.create({
                        data: {
                            email,
                            ipAddress: ip,
                        }
                    });

                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function googleSignIn() {
    await signIn('google');
}

// ... existing code ...

export async function updateUser(userId: number, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const department = formData.get('department') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    // Password update separate/optional

    if (!email || !name) {
        return { error: 'Missing required fields' };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                role,
                department,
                phoneNumber,
            },
        });

        await logAudit('UPDATE_USER', 'User', userId, { name, email, role, department, phoneNumber });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Failed to update user:', error);
        return { error: 'Failed to update user.' };
    }
}

export async function deleteUser(userId: number) {
    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        await logAudit('DELETE_USER', 'User', userId);
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete user:', error);
        return { error: 'Failed to delete user.' };
    }
}

// ... existing code ...

export async function createRole(formData: FormData) {
    const name = formData.get('name') as string;
    const permissions = formData.get('permissions') as string; // JSON string

    if (!name || !permissions) {
        return { error: 'Missing required fields' };
    }

    try {
        await prisma.role.create({
            data: {
                name,
                permissions,
            },
        });
        revalidatePath('/roles');
        return { success: true };
    } catch (error) {
        console.error('Failed to create role:', error);
        return { error: 'Failed to create role. Name might be taken.' };
    }
}

export async function deleteRole(id: number) {
    try {
        await prisma.role.delete({
            where: { id },
        });
        revalidatePath('/roles');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete role:', error);
        return { error: 'Failed to delete role.' };
    }
}

export async function logout() {
    await signOut();
}

export async function searchUsers(query: string) {
    if (!query) return [];

    const session = await auth();
    if (!session) return [];

    return await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { nickname: { contains: query } },
                { email: { contains: query } }
            ]
        },
        take: 5,
        select: { id: true, name: true, nickname: true, email: true, department: true }
    });
}

export async function getAllUsers() {
    const session = await auth();
    if (!session) return [];

    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            department: true,
            role: true
        },
        orderBy: { name: 'asc' }
    });
}
