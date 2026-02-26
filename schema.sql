-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Callers Table
CREATE TABLE callers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Sales Caller',
    phone TEXT NOT NULL,
    languages TEXT[] DEFAULT '{}',
    assigned_states TEXT[] DEFAULT '{}',
    daily_limit INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    city TEXT,
    state TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'unassigned')),
    assigned_to UUID REFERENCES callers(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    unassigned_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    raw JSONB
);

-- Daily assignment counters for callers
CREATE TABLE daily_counters (
    caller_id UUID REFERENCES callers(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    assigned_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (caller_id, day)
);

-- Round-Robin state tracking table
CREATE TABLE rr_state_index (
    state TEXT PRIMARY KEY,
    current_index INTEGER NOT NULL DEFAULT 0
);

-- Audit/Logs table for assignment tracking
CREATE TABLE assignments_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES callers(id) ON DELETE SET NULL,
    method TEXT NOT NULL,
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RPC Function for Atomic Round-Robin Selection
CREATE OR REPLACE FUNCTION get_next_rr_index(p_state TEXT) 
RETURNS integer AS $$
DECLARE 
  next_idx integer;
BEGIN
  INSERT INTO rr_state_index (state, current_index) 
  VALUES (p_state, 1)
  ON CONFLICT (state) 
  DO UPDATE SET current_index = rr_state_index.current_index + 1
  RETURNING current_index INTO next_idx;
  
  RETURN next_idx - 1;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
-- Enable RLS
ALTER TABLE callers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rr_state_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments_log ENABLE ROW LEVEL SECURITY;

-- Create blanket policies to allow anonymous read/write access 
-- (This is for the assessment demo purposes)
CREATE POLICY "Allow anonymous all" ON callers FOR ALL USING (true);
CREATE POLICY "Allow anonymous all" ON leads FOR ALL USING (true);
CREATE POLICY "Allow anonymous all" ON daily_counters FOR ALL USING (true);
CREATE POLICY "Allow anonymous all" ON rr_state_index FOR ALL USING (true);
CREATE POLICY "Allow anonymous all" ON assignments_log FOR ALL USING (true);

-- Ensure Realtime is enabled for leads table 
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
