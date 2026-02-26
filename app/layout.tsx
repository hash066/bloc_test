import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Bloc CRM',
    description: 'CRM for lead assignment',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-slate-50/50 flex h-screen overflow-hidden text-slate-900`}>
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 overflow-auto relative flex flex-col">
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
                    <div className="relative p-6 md:p-10 flex-1">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
