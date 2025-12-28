'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Eye, Smartphone, Monitor, Send, Copy, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import {
    getVariablesForCategory,
    getSampleDataForCategory,
    replaceVariables,
    validateTemplate,
    type TemplateVariable,
} from '@/lib/email-template-variables';

interface EnhancedTemplateEditorProps {
    category: string;
    initialSubject?: string;
    initialBody?: string;
    onSave: (subject: string, body: string) => void;
    onCancel: () => void;
}

export default function EnhancedTemplateEditor({
    category,
    initialSubject = '',
    initialBody = '',
    onSave,
    onCancel,
}: EnhancedTemplateEditorProps) {
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const variables = getVariablesForCategory(category);
    const sampleData = getSampleDataForCategory(category);

    // Insert variable at cursor position
    const insertVariable = (variableKey: string, targetField: 'subject' | 'body') => {
        const variable = `{${variableKey}}`;
        const ref = targetField === 'subject' ? subjectRef : bodyRef;
        const currentValue = targetField === 'subject' ? subject : body;
        const setValue = targetField === 'subject' ? setSubject : setBody;

        if (ref.current) {
            const start = ref.current.selectionStart || 0;
            const end = ref.current.selectionEnd || 0;
            const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
            setValue(newValue);

            // Set cursor position after inserted variable
            setTimeout(() => {
                ref.current?.focus();
                ref.current?.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        } else {
            setValue(currentValue + variable);
        }
    };

    // Copy variable to clipboard
    const copyVariable = (variableKey: string) => {
        navigator.clipboard.writeText(`{${variableKey}}`);
        setCopiedVariable(variableKey);
        setTimeout(() => setCopiedVariable(null), 2000);
    };

    // Render preview with replaced variables
    const renderPreview = () => {
        const previewSubject = replaceVariables(subject, sampleData);
        let previewBody = replaceVariables(body, sampleData);

        // Auto-format: Convert line breaks to proper paragraphs
        previewBody = previewBody
            .split('\n\n')
            .map(para => para.trim())
            .filter(para => para.length > 0)
            .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #374151;">${para.replace(/\n/g, '<br>')}</p>`)
            .join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${previewSubject}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <!-- Main Container -->
                            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                
                                <!-- Header with School Purple -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #574193 0%, #6b4fa3 100%); padding: 32px 40px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                            ${previewSubject}
                                        </h1>
                                    </td>
                                </tr>
                                
                                <!-- Body Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        ${previewBody}
                                    </td>
                                </tr>
                                
                                <!-- Divider -->
                                <tr>
                                    <td style="padding: 0 40px;">
                                        <div style="border-top: 2px solid #e5e7eb;"></div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 32px 40px; background-color: #f9fafb;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #574193;">
                                                        Magic Years International School
                                                    </p>
                                                    <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                                                        Asset Management System
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                            </table>
                            
                            <!-- Footer Note -->
                            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
                                <tr>
                                    <td align="center" style="padding: 0 20px;">
                                        <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                            This is an automated message from the School Asset Management System.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
    };

    // Send test email
    const sendTestEmail = async () => {
        const { value: email } = await Swal.fire({
            title: 'Send Test Email',
            input: 'email',
            inputLabel: 'Enter your email address',
            inputPlaceholder: 'your.email@example.com',
            showCancelButton: true,
            confirmButtonText: 'Send',
            confirmButtonColor: '#574193',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter an email address';
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Please enter a valid email address';
                }
            },
        });

        if (!email) return;

        setSending(true);
        try {
            const res = await fetch('/api/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject,
                    html: renderPreview(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Test Email Sent!',
                    text: data.message,
                    confirmButtonColor: '#574193',
                });
            } else {
                throw new Error(data.error || 'Failed to send test email');
            }
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed to Send',
                text: error.message,
                confirmButtonColor: '#574193',
            });
        } finally {
            setSending(false);
        }
    };

    // Validate and save
    const handleSave = () => {
        if (!subject.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Subject',
                text: 'Please enter an email subject',
                confirmButtonColor: '#574193',
            });
            return;
        }

        if (!body.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Body',
                text: 'Please enter email body content',
                confirmButtonColor: '#574193',
            });
            return;
        }

        // Validate variables
        const subjectValidation = validateTemplate(subject, category);
        const bodyValidation = validateTemplate(body, category);
        const unknownVars = [...new Set([...subjectValidation.unknownVariables, ...bodyValidation.unknownVariables])];

        if (unknownVars.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Unknown Variables',
                html: `The following variables are not recognized:<br><code>${unknownVars.join(', ')}</code><br><br>They will not be replaced when sending emails.`,
                confirmButtonColor: '#574193',
                showCancelButton: true,
                confirmButtonText: 'Save Anyway',
                cancelButtonText: 'Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    onSave(subject, body);
                }
            });
        } else {
            onSave(subject, body);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl my-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Email Template Editor</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Category: <span className="font-medium text-primary capitalize">{category.replace('_', ' ')}</span>
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Main Content - 3 Panels */}
                <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
                    {/* Left Panel - Variables */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-[600px] lg:max-h-full">
                        <div className="px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
                            <h3 className="font-semibold text-slate-900 text-sm">Available Variables</h3>
                            <p className="text-xs text-slate-500 mt-1">Click to insert</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {variables.map((variable) => (
                                <div
                                    key={variable.key}
                                    className="group relative bg-white border border-slate-200 rounded-lg p-2.5 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                                    onClick={() => insertVariable(variable.key, 'body')}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <code className="text-xs font-mono text-primary font-semibold block truncate">
                                                {`{${variable.key}}`}
                                            </code>
                                            <p className="text-xs text-slate-600 mt-0.5 truncate">{variable.label}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyVariable(variable.key);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all flex-shrink-0"
                                            title="Copy variable"
                                        >
                                            {copiedVariable === variable.key ? (
                                                <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-slate-400" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="mt-1.5 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-mono truncate">
                                        {variable.example}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle Panel - Editor */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col space-y-3 overflow-hidden min-h-0">
                        {/* Subject */}
                        <div className="flex-shrink-0">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Email Subject
                            </label>
                            <input
                                ref={subjectRef}
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Enter email subject... Use {variableName} for dynamic content"
                            />
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex-shrink-0">
                                Email Body
                            </label>
                            <div className="relative flex-1 min-h-0">
                                <textarea
                                    ref={bodyRef}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="w-full h-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs resize-none"
                                    placeholder="Type your email template here...&#10;&#10;Use {variableName} to insert dynamic content.&#10;&#10;Example:&#10;Dear {userName},&#10;&#10;Your {assetName} has been inspected on {inspectionDate}."
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-white px-2 py-1 rounded pointer-events-none">
                                    {body.length} characters
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={sendTestEmail}
                                disabled={sending || !subject || !body}
                                className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Test
                                    </>
                                )}
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-[600px] lg:max-h-full">
                        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                            <h3 className="font-semibold text-slate-900 text-sm">Live Preview</h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`p-1.5 rounded-lg transition-colors ${previewMode === 'desktop'
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    title="Desktop view"
                                >
                                    <Monitor className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`p-1.5 rounded-lg transition-colors ${previewMode === 'mobile'
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    title="Mobile view"
                                >
                                    <Smartphone className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-3 bg-slate-100 min-h-0">
                            <div className="w-full h-full flex items-start justify-center">
                                <div
                                    className={`bg-white rounded-lg shadow-lg transition-all duration-300 origin-top ${previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[600px]'
                                        }`}
                                    style={{
                                        transform: previewMode === 'mobile' ? 'scale(0.8)' : 'scale(1)',
                                        transformOrigin: 'top center',
                                    }}
                                >
                                    <iframe
                                        srcDoc={renderPreview()}
                                        className="w-full border-0 rounded-lg"
                                        style={{ height: '600px' }}
                                        title="Email Preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
