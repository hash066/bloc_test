"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase';
import { Lead } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import {
    Users,
    CheckCircle2,
    XCircle,
    PhoneCall,
    Search,
    TrendingUp,
    LayoutGrid,
    MoreHorizontal,
    ArrowUpRight,
    AlertCircle,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'destructive' | 'info' }) => {
    const variants = {
        default: "bg-slate-100 text-slate-600 border border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold",
        destructive: "bg-rose-50 text-rose-700 border-rose-100 font-semibold",
        info: "bg-indigo-50 text-indigo-700 border-indigo-100 font-semibold"
    };
    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] uppercase tracking-wider", variants[variant])}>
            {children}
        </span>
    );
};

export default function LeadsPage() {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCallers, setActiveCallers] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [flashIds, setFlashIds] = useState<Record<string, string>>({});
    const [statsData, setStatsData] = useState({ total: 0, assigned: 0, unassigned: 0 });
    const [isMounted, setIsMounted] = useState(false);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/leads?limit=250');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAllLeads(data);
                console.log('Leads fetched:', data.length);
            } else {
                setError(data.error || 'Invalid data format');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Fetch leads error:', message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatsSummary = async () => {
        try {
            // Unfiltered fetch for stats (no status/state filters, larger limit)
            const res = await fetch('/api/leads?limit=1000');
            const data = await res.json();
            if (Array.isArray(data)) {
                const todayStr = new Date().toDateString();
                const todayLeads = data.filter(l => l.created_at && new Date(l.created_at).toDateString() === todayStr);

                setStatsData({
                    total: todayLeads.length,
                    assigned: todayLeads.filter(l => l.status === 'assigned').length,
                    unassigned: todayLeads.filter(l => l.status === 'unassigned').length
                });
            }
        } catch (e) {
            console.error('Fetch stats summary error:', e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/callers');
            const data = await res.json();
            if (Array.isArray(data)) {
                setActiveCallers(data.filter((c: { is_active: boolean }) => c.is_active).length);
            }
        } catch {
            console.error('Fetch stats error');
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchLeads();
        fetchStatsSummary();
        fetchStats();
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const channel = supabaseBrowserClient()
            .channel('leads-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async (payload) => {
                const { data } = await supabaseBrowserClient()
                    .from('leads')
                    .select('*, caller:callers(*)')
                    .eq('id', (payload.new as Lead).id)
                    .single();

                if (data) {
                    if (payload.eventType === 'INSERT') {
                        toast.success(`New Lead: ${data.name}`, { description: `From ${data.source || 'Webhook'}` });
                        setAllLeads(prev => [data, ...prev]);
                        setFlashIds(prev => ({ ...prev, [data.id]: 'ring-2 ring-emerald-400 ring-offset-2 bg-emerald-50' }));
                        fetchStatsSummary(); // Update stats on new lead
                    } else {
                        setAllLeads(prev => prev.map(l => l.id === data.id ? data : l));
                        setFlashIds(prev => ({ ...prev, [data.id]: 'ring-2 ring-sky-400 ring-offset-2 bg-sky-50' }));
                        fetchStatsSummary(); // Update stats on status change
                    }
                    setTimeout(() => setFlashIds(prev => {
                        const next = { ...prev };
                        delete next[data.id];
                        return next;
                    }), 3000);
                }
            })
            .subscribe();

        return () => { supabaseBrowserClient().removeChannel(channel); };
    }, [isMounted]);

    const filteredLeads = useMemo(() => {
        return allLeads.filter(lead => {
            const matchesStatus = !statusFilter || lead.status === statusFilter;
            const matchesState = !stateFilter || lead.state === stateFilter;
            const matchesSearch = !searchQuery ||
                lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.phone?.includes(searchQuery);
            return matchesStatus && matchesState && matchesSearch;
        });
    }, [allLeads, statusFilter, stateFilter, searchQuery]);

    const stats = useMemo(() => {
        const todayStr = new Date().toDateString();
        const items = allLeads.filter(l => {
            try { return l.created_at && new Date(l.created_at).toDateString() === todayStr; }
            catch { return false; }
        });

        return {
            total: items.length,
            assigned: items.filter(l => l.status === 'assigned').length,
            unassigned: items.filter(l => l.status === 'unassigned').length,
            active: activeCallers
        };
    }, [allLeads, activeCallers]);

    const states = useMemo(() => {
        const s = new Set<string>();
        allLeads.forEach(l => { if (l.state) s.add(l.state); });
        return Array.from(s).sort();
    }, [allLeads]);

    if (!isMounted) return null;

    if (loading && allLeads.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydrating Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-10">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Leads Hub</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Real-time tracking of your incoming lead pipeline.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchLeads(); fetchStatsSummary(); fetchStats(); }}
                        className="group bg-indigo-600 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
                    >
                        <Zap className="w-4 h-4 transition-transform group-hover:scale-110" />
                        Sync Data
                    </button>
                    <button className="p-4 bg-white border border-slate-200/60 rounded-[24px] text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[24px] flex items-center gap-4 text-rose-800">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-bold text-sm">System Alert: {error}</p>
                    <button onClick={fetchLeads} className="ml-auto text-xs font-black uppercase tracking-widest underline decoration-2">Restart Feed</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Today", value: statsData.total, icon: LayoutGrid, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Assigned", value: statsData.assigned, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pending", value: statsData.unassigned, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Live Agents", value: stats.active, icon: PhoneCall, color: "text-sky-600", bg: "bg-sky-50" }
                ].map((stat, i) => (
                    <Card key={i} className="group relative p-7 hover:border-slate-300 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                        </div>
                        <div className="mt-6 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className={cn("h-full transition-all group-hover:w-1/2", stat.bg.replace('bg-', 'bg-').replace('50', '500'))} />
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-[32px] border border-slate-200/60 shadow-sm">
                <div className="flex-1 w-full group relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        placeholder="Find a lead..."
                        className="w-full bg-slate-50 border border-slate-50 rounded-[20px] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <select
                        className="flex-1 lg:w-48 bg-white border border-slate-200/60 rounded-[20px] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Status</option>
                        <option value="new">Incoming</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Pending</option>
                    </select>
                    <select
                        className="flex-1 lg:w-48 bg-white border border-slate-200/60 rounded-[20px] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition-all appearance-none"
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                    >
                        <option value="">State</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <Card className="border-slate-200/50 shadow-xl shadow-slate-200/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {["Lead", "Contact Info", "Location", "Channel", "Agent", "Status", "Activity"].map((th, i) => (
                                    <th key={i} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{th}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {filteredLeads.map((lead, idx) => {
                                const rowClass = flashIds[lead.id] ? `${flashIds[lead.id]}` : '';
                                return (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={lead.id}
                                        className={cn(
                                            "hover:bg-slate-50/50 transition-all group",
                                            rowClass
                                        )}
                                    >
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{lead.name || 'Anonymous'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-500">{lead.phone}</p>
                                            <p className="text-[10px] text-slate-300 font-medium lowercase">{lead.email || 'no email provided'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                <p className="font-black text-xs">{`${lead.city || ''}, ${lead.state || 'Local'}`}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl uppercase">
                                                {lead.source || 'Direct'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {lead.caller?.name?.[0] || '—'}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{lead.caller?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant={lead.status === 'assigned' ? 'success' : lead.status === 'new' ? 'info' : 'default'}>
                                                {lead.status === 'new' ? 'Incoming' : lead.status === 'unassigned' ? 'Pending' : lead.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                                            {formatRelativeTime(lead.created_at)}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                            {filteredLeads.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-200">
                                            <Users className="w-16 h-16 opacity-10" />
                                            <p className="font-black text-xs uppercase tracking-[0.3em]">No records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-20 border-t border-slate-100 pt-10 flex flex-col items-center gap-6">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Secure Infrastructure Provider</p>
            </div>
        </div>
    );
}
