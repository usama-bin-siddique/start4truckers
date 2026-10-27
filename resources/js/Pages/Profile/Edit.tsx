import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Shield, CheckCircle2 } from 'lucide-react';

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
            </div>
        </AppLayout>
    );
}

