import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const state = searchParams.get('state');
        const limit = parseInt(searchParams.get('limit') || '50');

        const supabase = supabaseServerClient();

        let query = supabase
            .from('leads')
            .select(`
        *,
        caller:callers(*)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) query = query.eq('status', status);
        if (state) query = query.eq('state', state);

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
