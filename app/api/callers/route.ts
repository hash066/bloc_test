import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = supabaseServerClient();
        const today = new Date().toISOString().split('T')[0];

        const { data: callers, error: callersError } = await supabase
            .from('callers')
            .select('*')
            .order('created_at', { ascending: false });

        if (callersError) {
            return NextResponse.json({ error: callersError.message }, { status: 500 });
        }

        const { data: counters, error: countersError } = await supabase
            .from('daily_counters')
            .select('caller_id, assigned_count')
            .eq('day', today);

        if (countersError) {
            return NextResponse.json({ error: countersError.message }, { status: 500 });
        }

        const counterMap = new Map();
        if (counters) {
            for (const t of counters) {
                counterMap.set(t.caller_id, t.assigned_count);
            }
        }

        const enriched = callers?.map(c => ({
            ...c,
            today_count: counterMap.get(c.id) || 0
        })) || [];

        return NextResponse.json(enriched);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, role, languages, assigned_states, daily_limit, phone } = body;

        const supabase = supabaseServerClient();

        const { data, error } = await supabase
            .from('callers')
            .insert({
                name,
                role: role || 'Sales Caller',
                phone,
                languages: languages || [],
                assigned_states: assigned_states || [],
                daily_limit: daily_limit || 60,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
