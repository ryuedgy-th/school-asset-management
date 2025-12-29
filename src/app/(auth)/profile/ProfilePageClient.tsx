'use client';

import { useState } from 'react';
import { User, Mail, Lock, Save, Edit, AlertCircle, Camera, X } from 'lucide-react';

interface ProfilePageClientProps {
    user: {
        id: number;
        name: string | null;
        nickname: string | null;
        email: string;
        image: string | null;
    };
    isOAuthUser: boolean; // true if logged in via Google OAuth
}

export default function ProfilePageClient({ user, isOAuthUser }: ProfilePageClientProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(user.image);

    const [formData, setFormData] = useState({
        name: user.name || '',
        nickname: user.nickname || '',
        email: user.email,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
                // Refresh page to update session
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setIsChangingPassword(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }

        // Validate file size (max 10MB before optimization)
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be less than 10MB' });
            return;
        }

        setUploadingPhoto(true);
        setMessage(null);

        try {
            // Import optimization utility
            const { optimizeImage } = await import('@/lib/image-optimization');

            // Optimize image for avatar (smaller size, square)
            const optimizedDataUrl = await optimizeImage(file, {
                maxWidth: 512,
                maxHeight: 512,
                quality: 0.85,
                format: 'webp'
            });

            // Update preview
            setPhotoPreview(optimizedDataUrl);

            // Upload to server
            const res = await fetch('/api/profile/photo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: optimizedDataUrl }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile photo updated!' });
                // Refresh page to update session
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to upload photo' });
                setPhotoPreview(user.image); // Revert preview
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload photo' });
            setPhotoPreview(user.image); // Revert preview
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!confirm('Remove profile photo?')) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile/photo', {
                method: 'DELETE',
            });

            const data = await res.json();

            if (res.ok) {
                setPhotoPreview(null);
                setMessage({ type: 'success', text: 'Profile photo removed' });
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to remove photo' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
                <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* OAuth User Notice */}
            {isOAuthUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Google Account</p>
                        <p>You're signed in with Google. Your email is managed by Google and cannot be changed here. Password changes are also not available for Google accounts.</p>
                    </div>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar with upload */}
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* Upload/Remove buttons */}
                            <div className="absolute -bottom-2 -right-2 flex gap-1">
                                <label className="cursor-pointer p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                                    <Camera size={14} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={uploadingPhoto}
                                        className="hidden"
                                    />
                                </label>
                                {photoPreview && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        disabled={saving}
                                        className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {uploadingPhoto && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{user.name || user.email}</h2>
                            {isOAuthUser && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </span>
                            )}
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Edit size={18} />
                            Edit Profile
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nickname
                            </label>
                            <input
                                type="text"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Enter your nickname"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                                {isOAuthUser && <span className="text-xs text-slate-500 ml-2">(Managed by Google)</span>}
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isOAuthUser}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Full Name</p>
                            <p className="text-sm font-medium text-slate-900">{user.name || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Nickname</p>
                            <p className="text-sm font-medium text-slate-900">{user.nickname || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Email Address</p>
                            <p className="text-sm font-medium text-slate-900">{user.email}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Change Card - Only for non-OAuth users */}
            {!isOAuthUser && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                            <p className="text-sm text-slate-600">Update your password to keep your account secure</p>
                        </div>
                        {!isChangingPassword && (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <Lock size={18} />
                                Change Password
                            </button>
                        )}
                    </div>

                    {isChangingPassword && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Enter new password (min 6 characters)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
