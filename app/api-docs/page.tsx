"use client";

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerSpec } from '@/lib/swagger';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading API Docs...</p>
        </div>
    </div>
});

export default function ApiDocsPage() {
    return (
        <div className="bg-white min-h-screen">
            <div className="bg-slate-900 py-10 px-6 border-b border-white/10">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-black text-white mb-2">API Documentation</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Interactive Swagger Console</p>
                </div>
            </div>
            <div className="max-w-7xl mx-auto py-10">
                <SwaggerUI spec={swaggerSpec} />
            </div>
            <style jsx global>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin-top: 0; }
        .swagger-ui .scheme-container { background: transparent; box-shadow: none; padding: 0; }
      `}</style>
        </div>
    );
}
