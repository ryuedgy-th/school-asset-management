/**
 * System Settings Helper Functions
 * Manages system-wide settings with encryption support
 */

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

export interface SystemSetting {
    key: string;
    value: string;
    category: string;
    isSecret: boolean;
}

/**
 * Get a system setting by key
 */
export async function getSystemSetting(key: string): Promise<string | null> {
    const setting = await prisma.systemSettings.findUnique({
        where: { key }
    });

    if (!setting || !setting.value) {
        return null;
    }

    // Decrypt if secret
    if (setting.isSecret) {
        try {
            return decrypt(setting.value);
        } catch (error) {
            console.error(`Failed to decrypt setting: ${key}`, error);
            return null;
        }
    }

    return setting.value;
}

/**
 * Set a system setting
 */
export async function setSystemSetting(
    key: string,
    value: string,
    options: {
        category?: string;
        isSecret?: boolean;
        updatedBy?: number;
    } = {}
): Promise<void> {
    const {
        category = 'general',
        isSecret = false,
        updatedBy
    } = options;

    // Encrypt if secret
    const finalValue = isSecret ? encrypt(value) : value;

    await prisma.systemSettings.upsert({
        where: { key },
        update: {
            value: finalValue,
            category,
            isSecret,
            updatedBy,
            updatedAt: new Date()
        },
        create: {
            key,
            value: finalValue,
            category,
            isSecret,
            updatedBy
        }
    });
}

/**
 * Get all settings by category
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
    const settings = await prisma.systemSettings.findMany({
        where: { category }
    });

    const result: Record<string, string> = {};

    for (const setting of settings) {
        if (!setting.value) continue;

        if (setting.isSecret) {
            try {
                result[setting.key] = decrypt(setting.value);
            } catch (error) {
                console.error(`Failed to decrypt setting: ${setting.key}`, error);
            }
        } else {
            result[setting.key] = setting.value;
        }
    }

    return result;
}

/**
 * Get scan passcode (with fallback to env)
 */
export async function getScanPasscode(): Promise<string> {
    const passcode = await getSystemSetting('scan_passcode');
    return passcode || process.env.SCAN_PASSCODE || 'MYIS2024';
}

/**
 * Check if scan passcode protection is enabled
 */
export async function isScanPasscodeEnabled(): Promise<boolean> {
    const enabled = await getSystemSetting('scan_passcode_enabled');
    return enabled === 'true';
}

/**
 * Update scan passcode
 */
export async function updateScanPasscode(
    newPasscode: string,
    updatedBy: number
): Promise<void> {
    // Validate passcode format
    if (!/^[A-Za-z0-9]{6,20}$/.test(newPasscode)) {
        throw new Error('Passcode must be 6-20 alphanumeric characters');
    }

    await setSystemSetting('scan_passcode', newPasscode, {
        category: 'security',
        isSecret: true,
        updatedBy
    });
}

/**
 * Toggle scan passcode protection
 */
export async function toggleScanPasscodeProtection(
    enabled: boolean,
    updatedBy: number
): Promise<void> {
    await setSystemSetting('scan_passcode_enabled', enabled.toString(), {
        category: 'security',
        isSecret: false,
        updatedBy
    });
}

/**
 * Get security settings metadata (for UI display)
 */
export async function getSecuritySettingsMetadata() {
    const passcodeEnabled = await isScanPasscodeEnabled();

    const passcodeSetting = await prisma.systemSettings.findUnique({
        where: { key: 'scan_passcode' }
    });

    return {
        scanPasscodeEnabled: passcodeEnabled,
        lastUpdated: passcodeSetting?.updatedAt || null,
        updatedBy: passcodeSetting?.updatedBy || null
    };
}
