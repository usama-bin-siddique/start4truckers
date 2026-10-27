import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Shield, CheckCircle2, Bell, Send } from 'lucide-react';
import { requestAndRegisterToken } from '@/lib/firebaseNotifications';
import { usePage } from '@inertiajs/react';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        created_at?: string;
    };
}

export default function Edit({ user }: Props) {
    const page = usePage<{ firebase?: { vapid_key?: string | null } }>();
    const [pushStatus, setPushStatus] = useState<string | null>(null);
    const [pushLoading, setPushLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.put('/profile', {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    const handleEnablePush = async () => {
        setPushLoading(true);
        setPushStatus(null);
        const res = await requestAndRegisterToken(page.props.firebase?.vapid_key);
        setPushStatus(res.message);
        setPushLoading(false);
    };

    const handleSendTestPush = async () => {
        setTestLoading(true);
        setPushStatus(null);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            const res = await fetch('/notifications/test-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
            });
            const data = await res.json();
            setPushStatus(data.message || (data.success ? 'Test push sent!' : 'Failed to send test push.'));
        } catch (err: any) {
            setPushStatus(err?.message || 'Error triggering test push.');
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <AppLayout title="My Profile">
            <Head title="My Profile" />

            <div className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Account Settings</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your account information, personal details, and security password.
                    </p>
                </div>

                {/* Profile Information */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-amber-600" />
                            <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Update your name and primary login email address.
                        </p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4 px-6 py-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    placeholder="Your Name"
                                    required
                                />
                                {profileForm.errors.name && (
                                    <p className="text-xs text-red-600">{profileForm.errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                                {profileForm.errors.email && (
                                    <p className="text-xs text-red-600">{profileForm.errors.email}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 pt-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                <span className="font-semibold text-gray-700">Account Role:</span>{' '}
                                <span className="capitalize">{user.role}</span>
                            </div>
                            {user.created_at && (
                                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                    <span className="font-semibold text-gray-700">Member Since:</span> {user.created_at}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3">
                            {profileForm.recentlySuccessful && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 size={14} /> Saved
                                </span>
                            )}
                            <Button
                                type="submit"
                                disabled={profileForm.processing}
                                className="bg-[#12141D] text-white hover:bg-black"
                            >
                                {profileForm.processing ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Password Update */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-amber-600" />
                            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Ensure your account is using a long, random password to stay secure.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 px-6 py-5">
                        <div className="space-y-1.5 sm:max-w-md">
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            {passwordForm.errors.current_password && (
                                <p className="text-xs text-red-600">{passwordForm.errors.current_password}</p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                {passwordForm.errors.password && (
                                    <p className="text-xs text-red-600">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-xs text-red-600">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3">
                            {passwordForm.recentlySuccessful && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 size={14} /> Password changed
                                </span>
                            )}
                            <Button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="bg-[#12141D] text-white hover:bg-black"
                            >
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Push Notifications Card */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-600" />
                            <h3 className="text-base font-semibold text-gray-900">Desktop Push Notifications (FCM)</h3>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Enable browser push notifications to receive real-time alerts for new leads, tasks, and client reminders.
                        </p>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        <p className="text-sm text-gray-600">
                            Click <span className="font-semibold text-gray-800">&quot;Enable Notifications on this Device&quot;</span> to allow browser notifications and register your desktop device token. Once enabled, use the test button to verify that incoming notifications are received and listened to.
                        </p>

                        {pushStatus && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                                {pushStatus}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={pushLoading}
                                onClick={handleEnablePush}
                                className="border-gray-300"
                            >
                                <Bell className="mr-2 h-4 w-4 text-amber-600" />
                                {pushLoading ? 'Registering...' : 'Enable Notifications on this Device'}
                            </Button>

                            <Button
                                type="button"
                                disabled={testLoading}
                                onClick={handleSendTestPush}
                                className="bg-[#12141D] text-white hover:bg-black"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {testLoading ? 'Sending...' : 'Send Test Notification'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

