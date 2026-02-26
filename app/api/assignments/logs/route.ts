import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = supabaseServerClient();

        const { data, error } = await supabase
            .from('assignments_log')
            .select(`
        *,
        lead:leads(*),
        caller:callers(*)
      `)
            .order('assigned_at', { ascending: false })
            .limit(100);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
