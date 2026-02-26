"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    History,
    Activity,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NavItemProps {
    href: string;
    icon: LucideIcon;
    children: React.ReactNode;
    collapsed: boolean;
}

function NavItem({ href, icon: Icon, children, collapsed }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative",
                isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
            )}
        >
            <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-white")} />
            <AnimatePresence mode="wait">
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-xs uppercase tracking-widest whitespace-nowrap"
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>

            {collapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {children}
                </div>
            )}
        </Link>
    );
}

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) setCollapsed(JSON.parse(saved));
    }, []);

    const toggle = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    if (!isMounted) return null;

    return (
        <motion.aside
            animate={{ width: collapsed ? 100 : 300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white border-r border-slate-200/60 flex flex-col shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-40"
        >
            {/* Toggle Button */}
            <button
                onClick={toggle}
                className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all z-50"
            >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                <div className={cn("mb-10 flex items-center gap-3", collapsed ? "justify-center" : "px-2")}>
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="overflow-hidden"
                        >
                            <h1 className="text-xl font-black tracking-tighter text-slate-900">Bloc CRM</h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none mt-1">Enterprise</p>
                        </motion.div>
                    )}
                </div>

                <div className="space-y-2">
                    {!collapsed && (
                        <p className="px-4 mb-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Main Menu</p>
                    )}
                    <NavItem href="/leads" icon={LayoutDashboard} collapsed={collapsed}>Dashboard</NavItem>
                    <NavItem href="/callers" icon={Users} collapsed={collapsed}>Team Members</NavItem>
                    <NavItem href="/logs" icon={History} collapsed={collapsed}>Activity Logs</NavItem>
                </div>

                <div className="mt-12 space-y-2">
                    {!collapsed && (
                        <p className="px-4 mb-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">System</p>
                    )}
                    <NavItem href="/settings" icon={Settings} collapsed={collapsed}>Settings</NavItem>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                <div className={cn(
                    "flex items-center transition-all duration-300 bg-white rounded-[24px] border border-slate-200/50 shadow-sm overflow-hidden",
                    collapsed ? "px-2 py-3 justify-center" : "p-3 justify-between"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 shrink-0">
                            AD
                        </div>
                        {!collapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <p className="text-xs font-black text-slate-900">Admin User</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    {!collapsed && (
                        <button className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl">
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
