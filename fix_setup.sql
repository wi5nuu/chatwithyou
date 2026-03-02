-- 💖 LoveChat - Penambahan Policy dan Fungsi yang Kurang
-- Jalankan ini di SQL Editor Supabase untuk melengkapi fitur pertemanan, telepon, dan pembuatan chat.

-- 1. FIX: Policy untuk CHATS (Agar bisa insert)
CREATE POLICY "Users can create chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- 2. FIX: Policy untuk CHAT PARTICIPANTS (Agar bisa melihat dan menambah peserta)
-- Menggunakan subquery sederhana pada tabel chats untuk menghindari rekursi pada tabel yang sama
CREATE POLICY "Users can view all participants of chats they belong to" 
ON public.chat_participants FOR SELECT 
USING (
  chat_id IN (
    SELECT id FROM public.chats
  )
);

-- Note: Karena public.chats sudah punya policy SELECT yang memfilter berdasarkan keanggotaan,
-- policy di atas akan secara otomatis membatasi akses ke participant chat yang valid saja.
CREATE POLICY "Users can add participants" ON public.chat_participants FOR INSERT WITH CHECK (true);

-- 3. FIX: Policy untuk CALLS & CANDIDATES (Penting untuk sistem Telepon/WebRTC)
CREATE POLICY "Users can view calls in their chats" ON public.calls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can create calls" ON public.calls FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can update calls" ON public.calls FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = public.calls.chat_id AND user_id = auth.uid()));

CREATE POLICY "Users can view candidates" ON public.call_candidates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.calls c JOIN public.chat_participants cp ON c.chat_id = cp.chat_id WHERE c.id = public.call_candidates.call_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can insert candidates" ON public.call_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. FIX: Policy untuk FRIENDSHIPS (Sistem Pertemanan)
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update friendship status" ON public.friendships FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. FUNGSI BARU: create_direct_chat (Dibutuhkan oleh supabase.ts)
-- Fungsi ini otomatis membuat chat dan menambahkan kedua peserta dalam satu transaksi.
DROP FUNCTION IF EXISTS public.create_direct_chat(uuid[]);
CREATE OR REPLACE FUNCTION public.create_direct_chat(participant_ids uuid[])
RETURNS json AS $$
DECLARE
    new_chat_id uuid;
    uid uuid;
BEGIN
    -- Buat chat baru
    INSERT INTO public.chats (is_group) VALUES (false) RETURNING id INTO new_chat_id;
    
    -- Tambahkan semua participant
    FOREACH uid IN ARRAY participant_ids
    LOOP
        INSERT INTO public.chat_participants (chat_id, user_id) VALUES (new_chat_id, uid);
    END LOOP;
    
    -- Kembalikan data chat
    RETURN (SELECT row_to_json(c) FROM public.chats c WHERE id = new_chat_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. STORAGE BUCKETS (Penting: Jalankan manual di UI Storage jika belum ada)
-- Pastikan bucket 'image' dan 'vidio' sudah dibuat dan diset 'Public'.
-- Berikut adalah policy SQL untuk mempermudah (opsional):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('image', 'image', true) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vidio', 'vidio', true) ON CONFLICT (id) DO NOTHING;
