/**
 * Email Template Variables
 * Defines available variables for each email category
 */

export interface TemplateVariable {
    key: string;
    label: string;
    description: string;
    example: string;
}

export const TEMPLATE_VARIABLES: Record<string, TemplateVariable[]> = {
    inspection: [
        { key: 'userName', label: 'User Name', description: "Borrower's name", example: 'John Doe' },
        { key: 'assetName', label: 'Asset Name', description: 'Name of the asset', example: 'MacBook Pro 16"' },
        { key: 'assetCode', label: 'Asset Code', description: 'Unique asset code', example: 'AST-2024-001' },
        { key: 'assetCategory', label: 'Asset Category', description: 'Category of asset', example: 'Laptop' },
        { key: 'assignmentNumber', label: 'Assignment Number', description: 'Assignment reference', example: 'ASN-2024-123' },
        { key: 'inspectorName', label: 'Inspector Name', description: "Inspector's name", example: 'Jane Smith' },
        { key: 'inspectionDate', label: 'Inspection Date', description: 'Date of inspection', example: 'December 27, 2024 at 09:30 PM' },
        { key: 'borrowDate', label: 'Borrow Date', description: 'Date asset was borrowed', example: 'January 15, 2024' },
        { key: 'overallCondition', label: 'Overall Condition', description: 'Overall condition rating', example: '✅ Good' },
        { key: 'exteriorCondition', label: 'Exterior Condition', description: 'Exterior condition', example: 'Minor Wear' },
        { key: 'screenCondition', label: 'Screen Condition', description: 'Screen condition', example: 'Perfect' },
        { key: 'keyboardCondition', label: 'Keyboard Condition', description: 'Keyboard condition', example: 'All Functional' },
        { key: 'batteryHealth', label: 'Battery Health', description: 'Battery health status', example: 'Normal' },
        { key: 'damageDescription', label: 'Damage Description', description: 'Description of damage', example: 'Minor scratch on lid' },
        { key: 'estimatedCost', label: 'Estimated Cost', description: 'Repair cost estimate', example: '2,500 THB' },
        { key: 'notes', label: 'Notes', description: 'Additional notes', example: 'Equipment in good condition' },
        { key: 'photoCount', label: 'Photo Count', description: 'Number of photos', example: '3' },
    ],
    assignment_signature: [
        { key: 'userName', label: 'User Name', description: "Teacher's name", example: 'John Doe' },
        { key: 'teacherName', label: 'Teacher Name', description: "Teacher's name", example: 'John Doe' },
        { key: 'userEmail', label: 'User Email', description: "Teacher's email", example: 'john.doe@school.com' },
        { key: 'signatureUrl', label: 'Signature URL', description: 'Link to sign', example: 'https://system.school.com/sign/abc123' },
        { key: 'date', label: 'Date', description: 'Current date', example: 'December 27, 2024' },
    ],
    damage_approval: [
        { key: 'userName', label: 'User Name', description: "Borrower's name", example: 'John Doe' },
        { key: 'assetName', label: 'Asset Name', description: 'Name of the asset', example: 'MacBook Pro 16"' },
        { key: 'assetCode', label: 'Asset Code', description: 'Unique asset code', example: 'AST-2024-001' },
        { key: 'damageDescription', label: 'Damage Description', description: 'Description of damage', example: 'Cracked screen' },
        { key: 'estimatedCost', label: 'Estimated Cost', description: 'Repair cost estimate', example: '15,000 THB' },
        { key: 'approvalStatus', label: 'Approval Status', description: 'Approval status', example: 'Approved' },
        { key: 'date', label: 'Date', description: 'Current date', example: 'December 27, 2024' },
    ],
    damage_waiver: [
        { key: 'userName', label: 'User Name', description: "Borrower's name", example: 'John Doe' },
        { key: 'assetName', label: 'Asset Name', description: 'Name of the asset', example: 'MacBook Pro 16"' },
        { key: 'assetCode', label: 'Asset Code', description: 'Unique asset code', example: 'AST-2024-001' },
        { key: 'damageDescription', label: 'Damage Description', description: 'Description of damage', example: 'Minor scratch' },
        { key: 'estimatedCost', label: 'Estimated Cost', description: 'Original cost estimate', example: '2,500 THB' },
        { key: 'waiverReason', label: 'Waiver Reason', description: 'Reason for waiver', example: 'Normal wear and tear' },
        { key: 'date', label: 'Date', description: 'Current date', example: 'December 27, 2024' },
    ],
    general: [
        { key: 'userName', label: 'User Name', description: "Recipient's name", example: 'John Doe' },
        { key: 'userEmail', label: 'User Email', description: "Recipient's email", example: 'john.doe@school.com' },
        { key: 'date', label: 'Date', description: 'Current date', example: 'December 27, 2024' },
        { key: 'schoolName', label: 'School Name', description: 'School name', example: 'Magic Years International School' },
    ],
};

/**
 * Get variables for a specific category
 */
export function getVariablesForCategory(category: string): TemplateVariable[] {
    return TEMPLATE_VARIABLES[category] || TEMPLATE_VARIABLES.general;
}

/**
 * Get sample data for preview
 */
export function getSampleDataForCategory(category: string): Record<string, string> {
    const variables = getVariablesForCategory(category);
    const sampleData: Record<string, string> = {};

    variables.forEach(v => {
        sampleData[v.key] = v.example;
    });

    return sampleData;
}

/**
 * Replace variables in template with actual data
 */
export function replaceVariables(template: string, data: Record<string, string>): string {
    let result = template;

    Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, value || '');
    });

    return result;
}

/**
 * Extract variables used in template
 */
export function extractVariables(template: string): string[] {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const matches = template.matchAll(regex);
    const variables = new Set<string>();

    for (const match of matches) {
        variables.add(match[1]);
    }

    return Array.from(variables);
}

/**
 * Validate template variables
 */
export function validateTemplate(template: string, category: string): {
    valid: boolean;
    unknownVariables: string[];
} {
    const usedVariables = extractVariables(template);
    const availableVariables = getVariablesForCategory(category);
    const availableKeys = new Set(availableVariables.map(v => v.key));

    const unknownVariables = usedVariables.filter(v => !availableKeys.has(v));

    return {
        valid: unknownVariables.length === 0,
        unknownVariables,
    };
}
