'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { LogIn, Loader2, ArrowRight } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />}
            {pending ? 'Signing in...' : 'Sign in to Console'}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);

    return (
        <div className="min-h-screen w-full flex bg-white">
            {/* Left: Branding & Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                {/* YouTube Video Background */}
                <iframe
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    src="https://www.youtube.com/embed/dGwQUlBdNuo?autoplay=1&mute=1&loop=1&playlist=dGwQUlBdNuo&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
                    title="Background Video"
                    allow="autoplay; encrypted-media"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '177.77777778vh',
                        height: '56.25vw',
                        minWidth: '100%',
                        minHeight: '100%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />

                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />

                <div className="relative z-10 w-full flex flex-col items-center justify-center p-12 text-center text-white">
                    <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
                        <div className="relative w-64 h-24">
                            <Image
                                src="/images/school-logo.png"
                                alt="MYIS International School"
                                fill
                                className="object-contain drop-shadow-md"
                                priority
                            />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight mb-4 drop-shadow-lg">
                        Welcome Back!
                    </h1>
                    <p className="text-lg text-blue-100 max-w-md leading-relaxed drop-shadow">
                        Access the Asset Master control panel to manage inventory, track requests, and maintain school equipment efficiency.
                    </p>

                    <div className="mt-12 flex items-center gap-2 text-sm text-white/50">
                        <span>Powered by</span>
                        <span className="font-bold text-white">AssetMaster Education</span>
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-slate-50 lg:bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="relative w-48 h-16">
                            <Image
                                src="/images/school-logo.png"
                                alt="MYIS International School"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h2>
                        <p className="text-sm text-slate-500">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <form action={dispatch} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm outline-none ring-offset-2 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="admin@school.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm outline-none ring-offset-2 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="••••••••"
                                />
                            </div>

                            {errorMessage && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-start gap-2 border border-red-100">
                                    <div className="mt-0.5"><LogIn size={16} /></div>
                                    <p>{errorMessage}</p>
                                </div>
                            )}

                            <LoginButton />
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <form action={async () => {
                            const { googleSignIn } = await import('@/app/lib/actions');
                            await googleSignIn();
                        }}>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                            >
                                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="h-5 w-5" />
                                <span>Sign in with Google</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
