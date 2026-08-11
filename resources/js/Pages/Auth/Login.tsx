import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2, Truck, Mail, Lock } from 'lucide-react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Login" />
            
            <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
                {/* Left Side - Image/Visual Section (70% width on desktop) */}
                <div className="hidden lg:flex lg:w-[70%] relative bg-white p-3">
                    {/* Dashboard Preview Image - Full Container with Rounded Border */}
                    <div className="w-full h-full">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                            <img 
                                src="/images/login-page.png" 
                                alt="Start4Truckers CRM Dashboard Preview" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form (30% width on desktop) */}
                <div className="w-full lg:w-[30%] flex items-center justify-center px-6 py-8 bg-white overflow-y-auto">
                    <div className="w-full max-w-md">
                        {/* Logo Section - Always on Top */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-3">
                                <Truck className="h-7 w-7 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-1">Start4Truckers</h1>
                            <p className="text-xs text-gray-500">Professional CRM Platform</p>
                        </div>

                        {/* Login Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
                            <p className="text-sm text-gray-600">Enter your credentials to access your account</p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@example.com"
                                        className={`h-11 pl-11 text-base rounded-xl ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'}`}
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                                {errors.email && (
                                    <div className="flex items-center gap-1.5 text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        className={`h-11 pl-11 pr-11 text-base rounded-xl ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'}`}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="flex items-center gap-1.5 text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.password}</span>
                                    </div>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer transition-colors"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Remember me</span>
                                </label>
                                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 mt-1 rounded-xl"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative my-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white text-gray-500 font-medium">Or continue with</span>
                                </div>
                            </div>

                            {/* Google Sign In Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-base font-semibold rounded-xl"
                            >
                                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </Button>
                        </form>

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-gray-600 mt-6">
                            Don't have an account?{' '}
                            <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                Sign up
                            </a>
                        </p>

                        {/* Footer */}
                        <p className="text-center text-xs text-gray-400 mt-6">
                            © 2024 Start4Truckers. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
