import { NextResponse } from 'next/server';
import { resetDailyCounters } from '@/lib/assignLead';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const cronKey = req.headers.get('x-cron-key');
        if (cronKey !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await resetDailyCounters();

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
