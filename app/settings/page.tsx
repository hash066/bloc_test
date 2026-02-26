"use client";

import { Settings as SettingsIcon, Shield, Database, HardDrive, Cpu } from 'lucide-react';

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200/60 rounded-[32px] shadow-sm p-8">
        {children}
    </div>
);

export default function SettingsPage() {
    return (
        <div className="max-w-[1200px] mx-auto space-y-12">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">System Control</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Configure your enterprise environment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Security & Access</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage roles and permissions</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
                            <span>Multi-factor Authentication</span>
                            <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600 opacity-50">
                            <span>Audit Logging Level</span>
                            <span className="text-[10px] uppercase font-black text-slate-400">Standard</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Infrastructure</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Service Health and Sync</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Cpu className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 italic">Edge Node: Mumbai-01</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Optimal</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <HardDrive className="text-slate-400 w-4 h-4" />
                                <span className="text-xs font-bold text-slate-600 italic">PostgreSQL Sync</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="p-12 border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <SettingsIcon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Advanced Module Control</h3>
                    <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto">These modules are currently under maintenance as part of the v2.4 rollout. Check back shortly.</p>
                </div>
            </div>
        </div>
    );
}
