-- Create keywords table for analysis logic
CREATE TABLE public.keywords (
  id SERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sensational', 'biased', 'source')),
  weight INTEGER NOT NULL
);

-- Create analysis_history table for logged-in users
CREATE TABLE public.analysis_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text_snippet TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  analysis_details JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Keywords are publicly readable (for analysis logic)
CREATE POLICY "Keywords are publicly readable"
  ON public.keywords
  FOR SELECT
  USING (true);

-- Users can only view their own analysis history
CREATE POLICY "Users can view own analysis history"
  ON public.analysis_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analysis history
CREATE POLICY "Users can insert own analysis history"
  ON public.analysis_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed keywords table with sample data
INSERT INTO public.keywords (term, type, weight) VALUES
  ('SHOCKING', 'sensational', 10),
  ('BOMBSHELL', 'sensational', 10),
  ('BREAKING', 'sensational', 8),
  ('EXCLUSIVE', 'sensational', 7),
  ('UNBELIEVABLE', 'sensational', 10),
  ('!!!', 'sensational', 5),
  ('obviously', 'biased', 5),
  ('everyone knows', 'biased', 5),
  ('clearly', 'biased', 4),
  ('without a doubt', 'biased', 6),
  ('some say', 'biased', 5),
  ('sources say', 'source', 15),
  ('an insider claims', 'source', 15),
  ('allegedly', 'source', 10),
  ('unconfirmed reports', 'source', 12),
  ('rumors suggest', 'source', 12);