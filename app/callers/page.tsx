"use client";

import { useEffect, useState } from 'react';
import { Caller } from '@/lib/types';
import {
    UserPlus,
    Globe,
    Shield,
    Zap,
    Search,
    ChevronDown,
    Plus,
    UserCircle,
    Phone,
    Briefcase,
    type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const LANGUAGES = ["Hindi", "English", "Kannada", "Marathi", "Tamil", "Telugu", "Bengali", "Gujarati"];

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-slate-200/60 rounded-[32px] shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const InputField = ({ label, icon: Icon, ...props }: { label: string; icon: LucideIcon } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                <Icon className="w-4 h-4" />
            </div>
            <input
                {...props}
                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
        </div>
    </div>
);

export default function CallersPage() {
    const [callers, setCallers] = useState<(Caller & { today_count?: number })[]>([]);
    const [name, setName] = useState('');
    const [role, setRole] = useState('Sales Caller');
    const [phone, setPhone] = useState('');
    const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [dailyLimit, setDailyLimit] = useState(60);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchCallers = async () => {
        const res = await fetch('/api/callers');
        const data = await res.json();
        if (Array.isArray(data)) setCallers(data);
    };

    useEffect(() => {
        fetchCallers();
        const interval = setInterval(fetchCallers, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async () => {
        if (!name || !phone) return alert('Name and Phone are required');
        setLoading(true);
        const res = await fetch('/api/callers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, role, phone, daily_limit: dailyLimit,
                languages: selectedLangs, assigned_states: selectedStates
            })
        });
        if (!res.ok) {
            const err = await res.json();
            toast.error(err.error || 'Failed to create caller');
            setLoading(false);
            return;
        }
        toast.success('Agent Registered', { description: `${name} has been added to the roster.` });
        setLoading(false);
        setName(''); setRole('Sales Caller'); setPhone('');
        setSelectedLangs([]); setSelectedStates([]); setDailyLimit(60);
        setShowForm(false);
        fetchCallers();
    };

    const handleToggleLang = (lang: string) => {
        setSelectedLangs(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
    };

    const handleToggleState = (st: string) => {
        setSelectedStates(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
    };

    const handleDeactivate = async (id: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this caller?`)) return;
        await fetch(`/api/callers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentStatus })
        });
        fetchCallers();
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12">
            <Toaster position="top-right" />
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 underline decoration-indigo-500/30 decoration-8 underline-offset-4">Team Roster</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Manage assignment agents and limits</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="group bg-indigo-600 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
                >
                    <UserPlus className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    {showForm ? 'Close Editor' : 'Register New Agent'}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-10 border-indigo-100 bg-indigo-50/20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="space-y-6">
                                    <InputField
                                        label="Full Name"
                                        icon={UserCircle}
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                        placeholder="Enter agent name"
                                    />
                                    <InputField
                                        label="Contact Number"
                                        icon={Phone}
                                        value={phone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                        placeholder="+91..."
                                    />
                                    <InputField
                                        label="Organizational Role"
                                        icon={Briefcase}
                                        value={role}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Linguistic Skills</label>
                                        <div className="flex flex-wrap gap-2">
                                            {LANGUAGES.map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => handleToggleLang(lang)}
                                                    className={cn(
                                                        "px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all",
                                                        selectedLangs.includes(lang)
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                                    )}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <InputField
                                        label="Daily Cap (Leads)"
                                        icon={Zap}
                                        type="number"
                                        value={dailyLimit}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyLimit(Number(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Operational Regions (States)</label>
                                    <div className="flex flex-wrap gap-2 bg-white p-4 rounded-[24px] border border-slate-100 shadow-inner">
                                        {INDIAN_STATES.map(st => (
                                            <button
                                                key={st}
                                                onClick={() => handleToggleState(st)}
                                                className={cn(
                                                    "px-3 py-2 text-[10px] font-black rounded-xl transition-all",
                                                    selectedStates.includes(st)
                                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-105"
                                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                                )}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="bg-slate-900 text-white px-12 py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Sync Agent to Roster'}
                                </button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm">
                <Search className="w-5 h-5 text-slate-300" />
                <input
                    placeholder="Search agents by name, role or region..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-600 placeholder:text-slate-300"
                />
                <div className="h-6 w-px bg-slate-100"></div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Sort by: <span className="text-slate-900 flex items-center gap-1 cursor-pointer">Performance <ChevronDown className="w-3 h-3" /></span>
                </div>
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {callers.map((caller, idx) => {
                    const count = caller.today_count || 0;
                    const limit = caller.daily_limit || 0;
                    const pct = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;
                    const isDanger = pct > 80;

                    return (
                        <motion.div
                            key={caller.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className={cn(
                                "group relative p-8 transition-all hover:border-indigo-200/60",
                                !caller.is_active && "opacity-60 saturate-0"
                            )}>
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-[22px] flex items-center justify-center text-xl font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            {caller.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">{caller.name}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{caller.role}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                                            caller.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-100 border-slate-200 text-slate-500"
                                        )}>
                                            {caller.is_active ? 'Online' : 'Resting'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {caller.languages?.map((l: string) => <span key={l} className="text-[10px] font-bold text-slate-600">{l}</span>)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {caller.assigned_states?.map((s: string) => <span key={s} className="bg-indigo-50/50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-indigo-100/50">{s}</span>)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 p-6 bg-slate-50/50 rounded-[24px] border border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Velocity</p>
                                            <span className="text-sm font-black text-slate-900">{count} <span className="text-slate-400">/ {limit}</span></span>
                                        </div>
                                        <span className={cn("text-xs font-black", isDanger ? "text-rose-500" : "text-emerald-500")}>
                                            {Math.round(pct)}%
                                        </span>
                                    </div>
                                    <div className="h-3 bg-white border border-slate-100 rounded-full overflow-hidden p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                isDanger ? "bg-rose-500 shadow-lg shadow-rose-100" : "bg-emerald-500 shadow-lg shadow-emerald-100"
                                            )}
                                        ></motion.div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => handleDeactivate(caller.id, caller.is_active)}
                                        className="flex-1 py-4 bg-white border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        {caller.is_active ? 'Suspend' : 'Resume'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newLimit = prompt('Enter new daily limit:', caller.daily_limit.toString());
                                            if (newLimit && !isNaN(Number(newLimit))) {
                                                fetch(`/api/callers/${caller.id}`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ daily_limit: Number(newLimit) })
                                                }).then(fetchCallers);
                                            }
                                        }}
                                        className="w-14 bg-slate-900 rounded-[20px] flex items-center justify-center text-white hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95"
                                    >
                                        <Zap className="w-4 h-4" />
                                    </button>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}

                {/* Empty State / Add Placeholder */}
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Deploy New Agent</span>
                    </button>
                )}
            </div>
        </div>
    );
}
