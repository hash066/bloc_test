import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const rawBody = await req.json();
        const { name, role, phone, languages, assigned_states, daily_limit, is_active } = rawBody;
        const supabase = supabaseServerClient();

        const { data, error } = await supabase
            .from('callers')
            .update({
                name,
                role,
                phone,
                languages,
                assigned_states,
                daily_limit,
                is_active
            })
            .eq('id', id)
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const supabase = supabaseServerClient();

        // Soft delete
        const { data, error } = await supabase
            .from('callers')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
