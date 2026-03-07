-- 💖 LoveChat Database Setup Script
-- Run this in your Supabase SQL Editor to set up all necessary tables and policies.

-- 1. PROFILES TABLE
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

-- 2. CHATS TABLE
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT, -- For group chats
  avatar_url TEXT, -- For group chats
  is_group BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  reset_at TIMESTAMPTZ, -- For auto-delete/reset feature
  game_level INTEGER DEFAULT 1,
  game_stats JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT game_level_limit CHECK (game_level <= 19)
);

-- 3. CHAT PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- 4. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'text', -- text, image, video, voice, location, poll
  ciphertext TEXT, -- Encrypted content
  iv TEXT, -- Encryption IV
  hash TEXT, -- Content hash
  decrypted_content TEXT, -- Fallback for non-E2EE or system messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For vanish mode
  is_ai BOOLEAN DEFAULT false,
  is_delivered BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false
);

-- Migrasi: Pastikan kolom is_delivered ada jika tabel sudah dibuat sebelumnya
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='messages' AND COLUMN_NAME='is_delivered') THEN
    ALTER TABLE public.messages ADD COLUMN is_delivered BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 5. CALLS
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- voice, video
  status TEXT DEFAULT 'ringing', -- ringing, connected, ended, declined
  offer JSONB,
  answer JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CALL CANDIDATES (WebRTC)
CREATE TABLE IF NOT EXISTS public.call_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FRIENDSHIPS
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- 8. STATUSES (Stories)
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'text', -- text, image, video
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POLLS
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

-- 🚀 ENABLE ROW LEVEL SECURITY
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

-- 11. MESSAGE REACTIONS
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.message_reactions(message_id);

-- RLS Policies for Reactions
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

-- 🛡️ RLS POLICIES (Summary)

-- 🛡️ RLS POLICIES

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 🔐 HELPER FUNCTION FOR NON-RECURSIVE RLS
-- This function skips RLS and allows checking membership without infinite recursion.
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_chat_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_id = p_chat_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Chats
DROP POLICY IF EXISTS "Users can view chats they are in" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
CREATE POLICY "Users can view chats they are in" ON public.chats FOR SELECT
  USING (public.is_chat_participant(id));
CREATE POLICY "Authenticated users can create chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Chat Participants
DROP POLICY IF EXISTS "Users can view participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
CREATE POLICY "Users can view participants of their chats" ON public.chat_participants FOR SELECT
  USING (public.is_chat_participant(chat_id));
CREATE POLICY "Users can join chats" ON public.chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.chats WHERE id = chat_id AND created_by = auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages or mark as read" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT
  USING (public.is_chat_participant(chat_id));
CREATE POLICY "Users can insert messages in their chats" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_chat_participant(chat_id));
CREATE POLICY "Users can update own messages or mark as read" ON public.messages FOR UPDATE
  USING (public.is_chat_participant(chat_id));

-- Friendships
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can respond to friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can remove friends" ON public.friendships;
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can respond to friend requests" ON public.friendships FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY "Users can remove friends" ON public.friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Calls
DROP POLICY IF EXISTS "Users can view calls in their chats" ON public.calls;
DROP POLICY IF EXISTS "Users can start calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update calls" ON public.calls;
CREATE POLICY "Users can view calls in their chats" ON public.calls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can start calls" ON public.calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users can update calls" ON public.calls FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));

-- Call Candidates
DROP POLICY IF EXISTS "Users can view/send candidates" ON public.call_candidates;
CREATE POLICY "Users can view/send candidates" ON public.call_candidates FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.calls JOIN public.chat_participants ON public.calls.chat_id = public.chat_participants.chat_id WHERE public.calls.id = call_id AND public.chat_participants.user_id = auth.uid()));

-- Statuses
DROP POLICY IF EXISTS "Everyone can view active statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can create own statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can delete own statuses" ON public.statuses;
CREATE POLICY "Everyone can view active statuses" ON public.statuses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own statuses" ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own statuses" ON public.statuses FOR DELETE USING (auth.uid() = user_id);

-- Polls
DROP POLICY IF EXISTS "Users can view polls in their chats" ON public.polls;
DROP POLICY IF EXISTS "Users can create polls" ON public.polls;
CREATE POLICY "Users can view polls in their chats" ON public.polls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.polls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can create polls" ON public.polls FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can view/add poll options" ON public.poll_options;
CREATE POLICY "Users can view/add poll options" ON public.poll_options FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Users can vote in polls" ON public.poll_votes;
CREATE POLICY "Users can vote in polls" ON public.poll_votes FOR ALL
  USING (auth.uid() = user_id);

-- 🏁 FUNCTIONS & TRIGGERS

-- Automatically create profile on signup
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

-- RPC Function to create a direct chat safely
CREATE OR REPLACE FUNCTION public.create_direct_chat(participant_ids UUID[])
RETURNS JSON AS $$
DECLARE
  new_chat_id UUID;
  uid UUID;
BEGIN
  -- Create new chat
  INSERT INTO public.chats (is_group) VALUES (false) RETURNING id INTO new_chat_id;
  
  -- Add participants
  FOREACH uid IN ARRAY participant_ids
  LOOP
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (new_chat_id, uid);
  END LOOP;
  
  -- Return chat data
  RETURN (SELECT row_to_json(c) FROM public.chats c WHERE id = new_chat_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a new direct chat safely
CREATE OR REPLACE FUNCTION public.get_or_create_chat(p_user1_id UUID, p_user2_id UUID)
RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- Check if a direct chat already exists
  SELECT cp1.chat_id INTO v_chat_id
  FROM public.chat_participants cp1
  JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  JOIN public.chats c ON c.id = cp1.chat_id
  WHERE c.is_group = false
    AND cp1.user_id = p_user1_id
    AND cp2.user_id = p_user2_id
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    -- Create new chat
    INSERT INTO public.chats (is_group) VALUES (false) RETURNING id INTO v_chat_id;
    -- Add participants
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat_id, p_user1_id), (v_chat_id, p_user2_id);
  END IF;

  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📦 STORAGE POLICIES (Run these to enable media uploads)
-- Note: Buckets 'image' and 'vidio' must be created in Supabase Dashboard first.

-- Allow authenticated users to upload to 'image' and 'vidio' buckets
-- Policy for 'image' bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to image" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from image" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to image" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'image' AND auth.role() = 'authenticated');
CREATE POLICY "Allow public select from image" ON storage.objects FOR SELECT 
  USING (bucket_id = 'image');

-- Policy for 'vidio' bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to vidio" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from vidio" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to vidio" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'vidio' AND auth.role() = 'authenticated');
CREATE POLICY "Allow public select from vidio" ON storage.objects FOR SELECT 
  USING (bucket_id = 'vidio');
