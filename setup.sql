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
  reset_at TIMESTAMPTZ -- For auto-delete/reset feature
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
  is_read BOOLEAN DEFAULT false
);

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

-- 🛡️ RLS POLICIES (Summary)

-- Profiles: Anyone authenticated can view, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Chats: Only participants can view
CREATE POLICY "Users can view chats they are in" ON public.chats FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = id AND user_id = auth.uid()));

-- Messages: Only participants can view/insert
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.messages.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their chats" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.messages.chat_id AND user_id = auth.uid()));

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
