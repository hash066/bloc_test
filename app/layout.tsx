import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { LayoutDashboard, Users, History, Activity, Settings, LogOut, type LucideIcon } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Bloc CRM',
    description: 'CRM for lead assignment',
};

function NavItem({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-medium"
        >
            <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>{children}</span>
        </Link>
    );
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-slate-50/50 flex h-screen overflow-hidden text-slate-900`}>
                {/* Sidebar */}
                <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="mb-10 flex items-center gap-3 px-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Activity className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Bloc CRM</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Main Menu</p>
                            <NavItem href="/leads" icon={LayoutDashboard}>Dashboard</NavItem>
                            <NavItem href="/callers" icon={Users}>Team Members</NavItem>
                            <NavItem href="/logs" icon={History}>Activity Logs</NavItem>
                        </div>

                        <div className="mt-10 space-y-1">
                            <p className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">System</p>
                            <NavItem href="/settings" icon={Settings}>Settings</NavItem>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                                    AD
                                </div>
                                <div>
                                    <p className="text-xs font-bold">Admin</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-slate-500 font-medium lowercase">Live</span>
                                    </div>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-rose-500 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
                    <div className="relative p-6 md:p-10">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
