import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { assignLead } from '@/lib/assignLead';
import { Lead } from '@/lib/types';

export async function POST(req: Request) {
    try {
        const hookKey = req.headers.get('x-hook-key');
        if (hookKey !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, city, state, source, raw } = body;

        if (!phone || phone.length < 10) {
            return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
        }

        const supabase = supabaseServerClient();

        // NOTE: Please add a UNIQUE index on the 'phone' column in the database 
        // to prevent race conditions during concurrent webhook submissions.
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json({ duplicate: true });
        }

        const rawData = raw || body;

        console.log('Inserting lead:', phone);
        const { data: newLead, error } = await supabase
            .from('leads')
            .insert({
                name,
                phone,
                city,
                state,
                source,
                status: 'new',
                raw: rawData
            })
            .select()
            .single();

        if (error || !newLead) {
            console.error('Insert lead error:', error);
            return NextResponse.json({ error: error?.message || 'Failed to insert lead' }, { status: 500 });
        }

        console.log('Lead inserted, starting assignment:', newLead.id);
        const result = await assignLead(newLead as Lead);
        console.log('Assignment result:', result);

        return NextResponse.json({
            ok: true,
            leadId: newLead.id,
            assigned: result.assigned,
            callerId: result.caller?.id
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
