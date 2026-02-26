"use client";

import { useEffect, useState } from 'react';
import { Lead, Caller, AssignmentLog } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import {
    History,
    Zap,
    Clock,
    AlertCircle,
    UserMinus
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// --- UI Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-slate-200/60 rounded-[32px] shadow-sm overflow-hidden ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'destructive' | 'info' }) => {
    const variants = {
        default: "bg-slate-50 text-slate-500 border border-slate-100",
        success: "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold",
        destructive: "bg-rose-50 text-rose-700 border-rose-100 font-bold",
        info: "bg-indigo-50 text-indigo-700 border-indigo-100 font-bold"
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest ${variants[variant]}`}>
            {children}
        </span>
    );
};

// --- Logs Page Implementation ---

export default function LogsPage() {
    const [logs, setLogs] = useState<(AssignmentLog & { lead?: Lead, caller?: Caller })[]>([]);
    const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
    const [callers, setCallers] = useState<Caller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [logsRes, leadsRes, callersRes] = await Promise.all([
                fetch('/api/assignments/logs').then(r => r.json()),
                fetch('/api/leads?status=unassigned').then(r => r.json()),
                fetch('/api/callers').then(r => r.json())
            ]);

            if (Array.isArray(logsRes)) setLogs(logsRes);
            if (Array.isArray(leadsRes)) setUnassignedLeads(leadsRes);
            if (Array.isArray(callersRes)) setCallers(callersRes.filter(c => c.is_active));

            console.log('Logs fetched:', Array.isArray(logsRes) ? logsRes.length : 'error');
        } catch (err: unknown) {
            console.error('Logs fetch error:', err);
            setError('System could not establish historical link.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchData();
    }, []);

    const handleReassign = async (leadId: string, callerId: string) => {
        try {
            const res = await fetch('/api/assignments/reassign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, callerId })
            });

            if (res.ok) {
                toast.success('Lead Redirected', { description: 'Manual override successful.' });
                fetchData();
            } else {
                const err = await res.json();
                toast.error('Override Failed', { description: err.error || 'Check system permissions.' });
            }
        } catch {
            toast.error('Override Failed');
        }
    };

    if (!isMounted) return null;

    if (loading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-12">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Operation Logs</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Lifecycle tracking of every enterprise lead event.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3 mr-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-50 bg-slate-200" />
                        ))}
                    </div>
                    <button onClick={fetchData} className="p-4 bg-white border border-slate-200/60 rounded-[24px] hover:bg-slate-50 transition-colors shadow-sm">
                        <Zap className="w-5 h-5 text-indigo-600" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-pulse border-rose-100 p-6 rounded-[24px] flex items-center gap-4 text-rose-800">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-bold text-sm">System Alert: {error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Logs Table */}
                <div className="lg:col-span-8 space-y-6">
                    <Card>
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Assignment History
                            </h2>
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-indigo-100">Live Feed</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/20 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                        <th className="px-8 py-5">Recipient</th>
                                        <th className="px-8 py-5">Region</th>
                                        <th className="px-8 py-5">Allocated To</th>
                                        <th className="px-8 py-5">Mechanism</th>
                                        <th className="px-8 py-5">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 font-bold text-slate-900">{log.lead?.name || 'Unknown'}</td>
                                            <td className="px-8 py-6">
                                                <Badge>{log.lead?.state || 'Global'}</Badge>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-700">{log.caller?.name || '-'}</td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-1 rounded-lg uppercase italic">{log.method}</span>
                                            </td>
                                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                                                {formatRelativeTime(log.assigned_at)}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center text-slate-300">
                                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                                <p className="text-xs font-black uppercase tracking-[0.2em]">No history detected</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Critical Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl shadow-indigo-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em]">Critical Queue</h3>
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            {unassignedLeads.length === 0 && (
                                <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-[32px]">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pipeline Healthy</p>
                                </div>
                            )}
                            {unassignedLeads.map(lead => (
                                <div key={lead.id} className="p-6 bg-slate-800/50 border border-slate-700 rounded-[32px] group hover:bg-slate-800 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black uppercase tracking-tight">{lead.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lead.unassigned_reason || 'Manual Review'}</p>
                                        </div>
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <select
                                        onChange={(e) => handleReassign(lead.id, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs font-bold text-indigo-400 outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">Redirect To Agent...</option>
                                        {callers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card className="p-8 bg-indigo-50/30 border-indigo-100 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <UserMinus className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automation Pause</p>
                            <p className="text-xs text-slate-600 font-bold italic">Manual re-routing enabled for critical events.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
