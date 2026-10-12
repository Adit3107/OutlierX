'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api-integration/auth';

function LoginForm() {
    const [view, setView] = useState('login'); // 'login', 'register', 'otp-verify', 'forgot-password', 'reset-password'
    const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '', otp: '', newPassword: '' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register, verifyRegistration } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for errors from URL (e.g. from Google Auth redirect failure)
    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError) {
            setError(urlError === 'GoogleAuthFailed' ? 'Google Sign-In failed.' : urlError);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (view === 'login') {
                await login(formData.email, formData.password);
                router.push('/dashboard');
            } else if (view === 'register') {
                const res = await register(formData.email, formData.password, formData.name, formData.phone);
                setSuccessMsg(res.message || 'OTP sent to your email.');
                setView('otp-verify');
            } else if (view === 'otp-verify') {
                await verifyRegistration(formData.email, formData.otp);
                router.push('/dashboard');
            } else if (view === 'forgot-password') {
                const res = await authApi.forgotPassword(formData.email);
                setSuccessMsg(res.message || 'Reset code sent to your email.');
                setView('reset-password');
            } else if (view === 'reset-password') {
                const res = await authApi.resetPassword(formData.email, formData.otp, formData.newPassword);
                setSuccessMsg(res.message || 'Password reset successful. Please login.');
                setView('login');
                setFormData({ ...formData, password: '', newPassword: '', otp: '' });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
            if (err.response?.data?.unverified) {
                setSuccessMsg('Your email is unverified. Please sign up again to receive a new OTP.');
                setView('register');
            } else if (err.response?.data?.forceReset) {
                setSuccessMsg('Your password has been reset by an administrator. Please check your email for a reset code to set a new password.');
                setView('reset-password');
                setFormData(prev => ({ ...prev, password: '' }));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const authUrl = process.env.VITE_API_URL_AUTH || process.env.NEXT_PUBLIC_API_URL_AUTH || 'http://localhost:3002';
        window.location.href = `${authUrl}/auth/google`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
            <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-blue-400">OutlierX</h2>
                    <p className="mt-2 text-gray-400">
                        {view === 'login' && 'Sign in to access your dashboard'}
                        {view === 'register' && 'Create an account to get started'}
                        {view === 'otp-verify' && 'Check your email for the verification code'}
                        {view === 'forgot-password' && 'Enter your email to receive a reset code'}
                        {view === 'reset-password' && 'Enter the reset code and your new password'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded text-sm">
                        {successMsg}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {(view === 'login' || view === 'register' || view === 'forgot-password') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Email address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={view === 'otp-verify' || view === 'reset-password'}
                                />
                            </div>
                        )}

                        {view === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {view === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    placeholder="+1 (555) 000-0000"
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {(view === 'login' || view === 'register') && (
                            <div>
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-gray-300">Password</label>
                                    {view === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => { setView('forgot-password'); setError(''); setSuccessMsg(''); }}
                                            className="text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {(view === 'otp-verify' || view === 'reset-password') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">6-Digit Code</label>
                                <input
                                    name="otp"
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="123456"
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center tracking-widest text-xl font-mono text-white"
                                    value={formData.otp}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {view === 'reset-password' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">New Password</label>
                                <input
                                    name="newPassword"
                                    type="password"
                                    required
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {view === 'login' && 'Sign in'}
                            {view === 'register' && 'Create account'}
                            {view === 'otp-verify' && 'Verify Email'}
                            {view === 'forgot-password' && 'Send Reset Code'}
                            {view === 'reset-password' && 'Reset Password'}
                        </button>

                        {(view === 'login' || view === 'register') && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-600" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
                                        <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd" />
                                    </svg>
                                    Google
                                </button>
                            </>
                        )}

                        {(view !== 'login' && view !== 'register') && (
                            <button
                                type="button"
                                onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </button>
                        )}
                    </div>
                </form>

                {(view === 'login' || view === 'register') && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); setSuccessMsg(''); }}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
