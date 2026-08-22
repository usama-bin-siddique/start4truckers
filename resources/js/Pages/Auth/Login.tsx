import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';
import { beginLoginSplash, cancelLoginSplash, finishLoginSplash } from '@/lib/loginSplash';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        beginLoginSplash();
        post('/login', {
            onError: () => cancelLoginSplash(),
            onSuccess: () => finishLoginSplash(),
            onCancel: () => cancelLoginSplash(),
        });
    }

    return (
        <>
            <Head title="Login" />

            <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#070b12]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_12%_-8%,rgba(196,110,40,0.42),transparent_58%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_88%_108%,rgba(56,90,140,0.18),transparent_60%)]" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.22]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(160,175,195,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(160,175,195,0.18) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                    }}
                />

                <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16">
                    <div className="mb-8 text-center">
                        <BrandLogo className="mx-auto mb-5 h-[148px] w-auto drop-shadow-[0_0_28px_rgba(245,158,11,0.35)]" />
                        <h1 className="sr-only">Start4Truckers</h1>
                        <p className="mt-3 text-[15px] text-white/45">
                            Sign in to your fleet workspace
                        </p>
                    </div>

                    <form
                        onSubmit={submit}
                        className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#12151c]/70 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                    >
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-[13px] font-medium text-white/55">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    autoFocus
                                    className={cn(
                                        'h-11 w-full rounded-lg border bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors',
                                        errors.email
                                            ? 'border-red-500/70 focus:border-red-400'
                                            : 'border-white/12 focus:border-amber-400'
                                    )}
                                />
                                {errors.email && (
                                    <div className="flex items-center gap-1.5 text-sm text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[13px] font-medium text-white/55">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        className={cn(
                                            'h-11 w-full rounded-lg border bg-white/[0.03] px-3.5 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition-colors',
                                            errors.password
                                                ? 'border-red-500/70 focus:border-red-400'
                                                : 'border-white/12 focus:border-amber-400'
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="flex items-center gap-1.5 text-sm text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.password}</span>
                                    </div>
                                )}
                            </div>

                            <label className="flex cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-white/30 bg-transparent accent-white"
                                />
                                <span className="text-sm text-white/50">Keep me signed in</span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 text-sm font-semibold text-[#1a1208] shadow-[0_10px_36px_rgba(245,158,11,0.42)] transition-[filter,transform] hover:brightness-110 disabled:opacity-70"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="relative z-10 pb-6 text-center text-xs text-white/25">
                    © 2024 Start4Truckers
                </p>
            </div>
        </>
    );
}
