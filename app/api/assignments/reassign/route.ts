import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { leadId, callerId } = body;

        if (!leadId || !callerId) {
            return NextResponse.json({ error: 'leadId and callerId are required' }, { status: 400 });
        }

        const supabase = supabaseServerClient();
        const today = new Date().toISOString().split('T')[0];

        const { error: leadUpdateError } = await supabase
            .from('leads')
            .update({
                assigned_to: callerId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (leadUpdateError) {
            return NextResponse.json({ error: leadUpdateError.message }, { status: 500 });
        }

        await supabase
            .from('assignments_log')
            .insert({
                lead_id: leadId,
                caller_id: callerId,
                method: 'manual',
                notes: 'Manual reassignment'
            });

        const { data: currentCounter } = await supabase
            .from('daily_counters')
            .select('assigned_count')
            .eq('caller_id', callerId)
            .eq('day', today)
            .maybeSingle();

        const nextCount = (currentCounter?.assigned_count || 0) + 1;

        await supabase
            .from('daily_counters')
            .upsert({
                caller_id: callerId,
                day: today,
                assigned_count: nextCount
            }, { onConflict: 'caller_id,day' });

        return NextResponse.json({ ok: true, assigned: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
