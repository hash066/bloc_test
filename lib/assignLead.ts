import { supabaseServerClient } from './supabase';
import { Lead, Caller } from './types';

export async function assignLead(lead: Lead): Promise<{ assigned: boolean, caller?: Caller, reason?: string }> {
    const supabase = supabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    // Step 1: Query callers where active and assigned_states contains lead.state
    let isFallback = false;
    let { data: pool } = await supabase
        .from('callers')
        .select('*')
        .eq('is_active', true)
        .contains('assigned_states', [lead.state]);

    // Step 2: Fallback to all active callers
    if (!pool || pool.length === 0) {
        isFallback = true;
        const { data: allActive } = await supabase
            .from('callers')
            .select('*')
            .eq('is_active', true);
        pool = allActive || [];
    }

    // Step 3: Filter out callers where assigned_count >= daily_limit
    const callerIds = (pool as Caller[]).map((c: Caller) => c.id);
    const counterMap = new Map<string, number>();

    if (callerIds.length > 0) {
        const { data: counters } = await supabase
            .from('daily_counters')
            .select('*')
            .eq('day', today)
            .in('caller_id', callerIds);

        if (counters) {
            for (const c of counters) {
                counterMap.set(c.caller_id, c.assigned_count);
            }
        }
    }

    const eligible: Caller[] = [];
    for (const caller of pool as Caller[]) {
        const count = counterMap.get(caller.id) || 0;
        if (count < caller.daily_limit) {
            eligible.push(caller);
        }
    }

    // Step 4: If eligible empty, mark unassigned
    if (eligible.length === 0) {
        await markUnassigned(lead.id, 'caps_full');
        return { assigned: false, reason: 'caps_full' };
    }

    // Ensure deterministic ordering
    eligible.sort((a, b) => a.id.localeCompare(b.id));

    // Step 5: Get round-robin index
    const stateKey = isFallback ? '__global__' : lead.state;
    let current_index = 0;

    // Use atomic RPC if it exists, otherwise fallback to non-atomic read-increment-write
    // To prevent race conditions, create this RPC in Supabase:
    // CREATE OR REPLACE FUNCTION get_next_rr_index(p_state TEXT) RETURNS integer AS $$
    // DECLARE next_idx integer;
    // BEGIN
    //   INSERT INTO rr_state_index (state, current_index) VALUES (p_state, 1)
    //   ON CONFLICT (state) DO UPDATE SET current_index = rr_state_index.current_index + 1
    //   RETURNING current_index INTO next_idx;
    //   RETURN next_idx - 1;
    // END;
    // $$ LANGUAGE plpgsql;
    try {
        const { data: nextIdx, error: rpcError } = await supabase.rpc('get_next_rr_index', { p_state: stateKey });
        if (rpcError) throw rpcError;
        current_index = nextIdx ?? 0;
    } catch (err) {
        console.error('RPC Error, falling back to non-atomic update:', err);
        const { data: rrData } = await supabase.from('rr_state_index').select('current_index').eq('state', stateKey).maybeSingle();
        current_index = rrData?.current_index || 0;
        await supabase.from('rr_state_index').upsert({ state: stateKey, current_index: current_index + 1 }, { onConflict: 'state' });
    }

    const actualIndex = current_index % eligible.length;

    // Step 6: Pick caller and update tables
    const selectedCaller = eligible[actualIndex];

    // UPDATE leads
    await supabase
        .from('leads')
        .update({
            assigned_to: selectedCaller.id,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
        })
        .eq('id', lead.id);

    // UPSERT daily_counters
    const currentCount = counterMap.get(selectedCaller.id) || 0;
    await supabase
        .from('daily_counters')
        .upsert({
            caller_id: selectedCaller.id,
            day: today,
            assigned_count: currentCount + 1
        }, { onConflict: 'caller_id,day' });

    // INSERT log
    await supabase
        .from('assignments_log')
        .insert({
            lead_id: lead.id,
            caller_id: selectedCaller.id,
            method: isFallback ? 'global_rr' : 'state_rr',
            notes: `Assigned index ${actualIndex}`
        });

    return { assigned: true, caller: selectedCaller };
}

export async function markUnassigned(leadId: string, reason: string) {
    const supabase = supabaseServerClient();
    await supabase
        .from('leads')
        .update({ status: 'unassigned', unassigned_reason: reason })
        .eq('id', leadId);

    await supabase
        .from('assignments_log')
        .insert({
            lead_id: leadId,
            method: 'unassigned',
            notes: `Unassigned reason: ${reason}`
        });
}

export async function resetDailyCounters() {
    const supabase = supabaseServerClient();
    const today = new Date().toISOString().split('T')[0];
    await supabase
        .from('daily_counters')
        .delete()
        .lt('day', today);
}
