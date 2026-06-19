-- LoveChat Database Setup
-- Run this in your Supabase SQL Editor to initialize all tables, policies, triggers, and functions.
-- This file consolidates setup.sql, fix_setup.sql, and streak_setup.sql.

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

-- 1.1 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  public_key TEXT,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  chat_wallpaper TEXT
);

-- Add points column if not exists (for gamification)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='points') THEN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

-- 1.2 CHATS
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  avatar_url TEXT,
  is_group BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  reset_at TIMESTAMPTZ,
  game_level INTEGER DEFAULT 1,
  game_stats JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT game_level_limit CHECK (game_level <= 19)
);

-- 1.3 CHAT PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- 1.4 MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'text',
  ciphertext TEXT,
  iv TEXT,
  hash TEXT,
  decrypted_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_ai BOOLEAN DEFAULT false,
  is_delivered BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='messages' AND COLUMN_NAME='is_delivered') THEN
    ALTER TABLE public.messages ADD COLUMN is_delivered BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 1.5 CALLS
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'ringing',
  offer JSONB,
  answer JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 CALL CANDIDATES (WebRTC)
CREATE TABLE IF NOT EXISTS public.call_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 FRIENDSHIPS
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- 1.8 STATUSES (Stories)
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'text',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 POLLS
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  multiple_choice BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- 1.10 MESSAGE REACTIONS
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.message_reactions(message_id);

-- 1.11 CHAT STREAKS (Gamification)
CREATE TABLE IF NOT EXISTS public.chat_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_count INTEGER DEFAULT 0,
  last_streak_date DATE,
  user1_last_claim DATE,
  user2_last_claim DATE,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  is_reset_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id)
);

-- ============================================================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_streaks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 3: RLS POLICIES
-- ============================================================================

-- 3.1 Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3.2 Helper function for non-recursive RLS
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_chat_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_id = p_chat_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3.3 Chats
DROP POLICY IF EXISTS "Users can view chats they are in" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can view chats they are in" ON public.chats FOR SELECT
  USING (true);
CREATE POLICY "Users can create chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- 3.4 Chat Participants
DROP POLICY IF EXISTS "Users can view participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow users to view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view all participants of chats they belong to" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.chat_participants;
CREATE POLICY "Participants visibility" ON public.chat_participants FOR SELECT USING (true);
CREATE POLICY "Users can add participants" ON public.chat_participants FOR INSERT WITH CHECK (true);

-- 3.5 Messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages or mark as read" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT
  USING (public.is_chat_participant(chat_id));
CREATE POLICY "Users can insert messages in their chats" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_chat_participant(chat_id));
CREATE POLICY "Users can update own messages or mark as read" ON public.messages FOR UPDATE
  USING (public.is_chat_participant(chat_id));

-- 3.6 Friendships
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can respond to friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can remove friends" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendship status" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update friendship status" ON public.friendships FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 3.7 Calls
DROP POLICY IF EXISTS "Users can view calls in their chats" ON public.calls;
DROP POLICY IF EXISTS "Users can start calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update calls" ON public.calls;
DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
CREATE POLICY "Users can view calls in their chats" ON public.calls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can create calls" ON public.calls FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can update calls" ON public.calls FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));

-- 3.8 Call Candidates
DROP POLICY IF EXISTS "Users can view/send candidates" ON public.call_candidates;
DROP POLICY IF EXISTS "Users can view candidates" ON public.call_candidates;
DROP POLICY IF EXISTS "Users can insert candidates" ON public.call_candidates;
CREATE POLICY "Users can view candidates" ON public.call_candidates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.calls c JOIN public.chat_participants cp ON c.chat_id = cp.chat_id WHERE c.id = public.call_candidates.call_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can insert candidates" ON public.call_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3.9 Statuses
DROP POLICY IF EXISTS "Everyone can view active statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can create own statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can delete own statuses" ON public.statuses;
CREATE POLICY "Everyone can view active statuses" ON public.statuses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own statuses" ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own statuses" ON public.statuses FOR DELETE USING (auth.uid() = user_id);

-- 3.10 Polls
DROP POLICY IF EXISTS "Users can view polls in their chats" ON public.polls;
DROP POLICY IF EXISTS "Users can create polls" ON public.polls;
CREATE POLICY "Users can view polls in their chats" ON public.polls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.polls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can create polls" ON public.polls FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can view/add poll options" ON public.poll_options;
CREATE POLICY "Users can view/add poll options" ON public.poll_options FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can vote in polls" ON public.poll_votes;
CREATE POLICY "Users can vote in polls" ON public.poll_votes FOR ALL USING (auth.uid() = user_id);

-- 3.11 Message Reactions
DROP POLICY IF EXISTS "Users can view reactions in their chats" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can insert their own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.message_reactions;
CREATE POLICY "Users can view reactions in their chats"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reactions"
  ON public.message_reactions FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 3.12 Chat Streaks
DROP POLICY IF EXISTS "Users can view streaks for their chats" ON public.chat_streaks;
DROP POLICY IF EXISTS "Users can update streaks for their chats" ON public.chat_streaks;
DROP POLICY IF EXISTS "System can insert streaks" ON public.chat_streaks;
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

-- ============================================================================
-- SECTION 4: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- 4.1 Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4.2 Create a direct chat in a single transaction
DROP FUNCTION IF EXISTS public.create_direct_chat(uuid[]);
CREATE OR REPLACE FUNCTION public.create_direct_chat(participant_ids uuid[])
RETURNS json AS $$
DECLARE
  new_chat_id uuid;
  uid uuid;
BEGIN
  INSERT INTO public.chats (is_group) VALUES (false) RETURNING id INTO new_chat_id;
  FOREACH uid IN ARRAY participant_ids
  LOOP
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (new_chat_id, uid);
  END LOOP;
  RETURN (SELECT row_to_json(c) FROM public.chats c WHERE id = new_chat_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Get or create a direct chat
CREATE OR REPLACE FUNCTION public.get_or_create_chat(p_user1_id UUID, p_user2_id UUID)
RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  SELECT cp1.chat_id INTO v_chat_id
  FROM public.chat_participants cp1
  JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  JOIN public.chats c ON c.id = cp1.chat_id
  WHERE c.is_group = false
    AND cp1.user_id = p_user1_id
    AND cp2.user_id = p_user2_id
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (is_group) VALUES (false) RETURNING id INTO v_chat_id;
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat_id, p_user1_id), (v_chat_id, p_user2_id);
  END IF;

  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.4 Increment points RPC (for gamification)
CREATE OR REPLACE FUNCTION public.increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: STORAGE POLICIES
-- ============================================================================

-- Create buckets (uncomment if running via SQL; otherwise create in Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('image', 'image', true) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vidio', 'vidio', true) ON CONFLICT (id) DO NOTHING;

-- Image bucket policies
DROP POLICY IF EXISTS "Allow authenticated uploads to image" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from image" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to image" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'image' AND auth.role() = 'authenticated');
CREATE POLICY "Allow public select from image" ON storage.objects FOR SELECT
  USING (bucket_id = 'image');

-- Vidio bucket policies
DROP POLICY IF EXISTS "Allow authenticated uploads to vidio" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from vidio" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to vidio" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vidio' AND auth.role() = 'authenticated');
CREATE POLICY "Allow public select from vidio" ON storage.objects FOR SELECT
  USING (bucket_id = 'vidio');
