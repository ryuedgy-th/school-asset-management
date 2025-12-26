import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function LoginPage() {
    const session = await auth();
    if (session?.user) {
        redirect('/');
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* YouTube Video Background */}
            <div className="absolute inset-0 w-full h-full">
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
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Login Card - Centered */}
            <div className="relative z-10 w-full max-w-md mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header with Logo */}
                    <div className="bg-white p-4 sm:p-6 text-center border-b border-slate-200">
                        <div className="flex justify-center mb-1">
                            <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                                <Image
                                    src="/images/school-logo.png"
                                    alt="Magic Years International School"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5">Asset Management</h1>
                        <p className="text-slate-600 text-xs">Magic Years International School</p>
                    </div>

                    {/* Login Form */}
                    <div className="p-4 sm:p-6 space-y-4">
                        {/* Welcome Message */}
                        <div className="text-center space-y-1">
                            <h2 className="text-lg font-bold text-slate-900">Welcome Back</h2>
                            <p className="text-xs text-slate-600">Sign in with your school account</p>
                        </div>

                        {/* Google Sign In Button */}
                        <form
                            action={async () => {
                                'use server';
                                await signIn('google', { redirectTo: '/' });
                            }}
                        >
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md group"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-slate-700 font-semibold group-hover:text-slate-900 text-sm">Continue with Google Workspace</span>
                            </button>
                        </form>

                        {/* Domain Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-xs text-blue-800">
                                    <p className="font-semibold mb-0.5">School Account Required</p>
                                    <p className="text-blue-700">Please sign in with your <span className="font-mono bg-blue-100 px-1 py-0.5 rounded">@magicyears.ac.th</span> email.</p>
                                </div>
                            </div>
                        </div>

                        {/* Admin Login Section */}
                        <div className="pt-3 border-t border-slate-200">
                            <details className="group">
                                <summary className="cursor-pointer text-center text-xs text-slate-500 hover:text-slate-700 transition-colors list-none flex items-center justify-center gap-1.5">
                                    <span>Admin Login (Email/Password)</span>
                                    <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>

                                <div className="mt-3 space-y-2">
                                    <form
                                        action={async (formData: FormData) => {
                                            'use server';
                                            await signIn('credentials', {
                                                email: formData.get('email'),
                                                password: formData.get('password'),
                                                redirectTo: '/',
                                            });
                                        }}
                                        className="space-y-2"
                                    >
                                        <div>
                                            <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="admin@school.com"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1">
                                                Password
                                            </label>
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                                        >
                                            Sign In
                                        </button>
                                    </form>
                                    <p className="text-xs text-slate-500 text-center">
                                        For IT administrators only
                                    </p>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        <p className="text-center text-xs text-slate-500">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </div>

                {/* Bottom Text */}
                <p className="text-center text-white text-sm mt-4 drop-shadow-lg">
                    Need help? Contact IT Support
                </p>
            </div>
        </div>
    );
}
