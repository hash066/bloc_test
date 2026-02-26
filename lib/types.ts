export interface Caller {
  id: string;
  name: string;
  role: string;
  phone: string;
  languages: string[];
  assigned_states: string[];
  daily_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state: string;
  source?: string;
  status: string; // 'new' | 'assigned' | 'unassigned'
  assigned_to?: string;
  assigned_at?: string;
  unassigned_reason?: string;
  created_at: string;
  caller?: Caller;
}

export interface AssignmentLog {
  id: string;
  lead_id: string;
  caller_id?: string;
  assigned_at: string;
  method: string; // 'state_rr' | 'global_rr' | 'manual'
  notes?: string;
}

export interface DailyCounter {
  caller_id: string;
  day: string; // 'yyyy-mm-dd'
  assigned_count: number;
}
