import React, { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Truck } from 'lucide-react';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export default function Login() {
    const { data, setData, post, processing, errors } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Sign In" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">

                    {/* Logo */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                            <Truck className="text-white" size={28} />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Start4Truckers</h1>
                            <p className="text-sm text-gray-500 mt-0.5">CRM Management System</p>
                        </div>
                    </div>

                    {/* Card */}
                    <Card className="shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Sign in to your account</CardTitle>
                            <CardDescription>Enter your credentials to access the CRM</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Global error */}
                                {errors.email && (
                                    <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                        <span>{errors.email}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="you@start4truckers.com"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className={errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="remember" className="font-normal text-gray-600 cursor-pointer">
                                        Remember me
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={processing}
                                >
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-gray-400">
                        Start4Truckers CRM &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </>
    );
}
