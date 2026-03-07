-- 🛡️ LoveChat Streak Feature Setup
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chat_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_count INTEGER DEFAULT 0,
  last_streak_date DATE, -- The date of the last increment
  user1_last_claim DATE, -- Last date user1 clicked the fire
  user2_last_claim DATE, -- Last date user2 clicked the fire
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  is_reset_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id)
);

-- Add points to profiles if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='points') THEN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.chat_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view streaks for their chats"
  ON public.chat_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_streaks.chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update streaks for their chats"
  ON public.chat_streaks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_streaks.chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert streaks"
  ON public.chat_streaks FOR INSERT
  WITH CHECK (true);

-- RPC to safely increment points
CREATE OR REPLACE FUNCTION public.increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
