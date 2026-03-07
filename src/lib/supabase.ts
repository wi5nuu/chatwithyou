import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Poll } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// ─── Profiles ────────────────────────────────────────────────────────────────

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: {
  online?: boolean;
  last_seen?: string;
  public_key?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .maybeSingle();
  return { data, error };
};

export const createProfile = async (userId: string, email: string, publicKey: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, email, public_key: publicKey, online: true });
  return { data, error };
};

export const searchProfiles = async (query: string, excludeUserId: string) => {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, email, display_name, avatar_url, online, last_seen')
    .neq('id', excludeUserId)
    .ilike('email', `%${query}%`)
    .limit(10);
  return { data, error };
};

// ─── Storage / Media Upload ───────────────────────────────────────────────────

export const uploadImage = async (file: File, userId: string): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('image').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('uploadImage error:', JSON.stringify(error));
    return null;
  }
  console.log('uploadImage success, path:', data?.path);
  const { data: urlData } = supabase.storage.from('image').getPublicUrl(filePath);
  return urlData.publicUrl;
};

export const uploadVideo = async (file: File, userId: string): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('vidio').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('uploadVideo error:', JSON.stringify(error));
    return null;
  }
  console.log('uploadVideo success, path:', data?.path);
  const { data: urlData } = supabase.storage.from('vidio').getPublicUrl(filePath);
  return urlData.publicUrl;
};

export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${ext}`;
  const { error } = await supabase.storage.from('image').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('Upload avatar error:', JSON.stringify(error));
    return null;
  }
  const { data } = supabase.storage.from('image').getPublicUrl(filePath);
  // Add a cache buster timestamp so the UI refreshes if the user uploads a new one with same name
  return `${data.publicUrl}?t=${Date.now()}`;
};

// ─── Chats ───────────────────────────────────────────────────────────────────

export const getUserChats = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_participants')
    .select(`
      chat_id,
      chats:chat_id (
        id,
        created_at,
        reset_at,
        is_group,
        name,
        avatar_url,
        participants:chat_participants (
          user_id,
          profile:user_id (id, email, display_name, avatar_url, public_key, online, last_seen)
        ),
        messages (id, type, ciphertext, iv, hash, created_at, sender_id, is_delivered, is_read)
      )
    `)
    .eq('user_id', userId);
  return { data, error };
};

export const createDirectChat = async (participants: string[]) => {
  // Menggunakan RPC function dengan SECURITY DEFINER untuk bypass RLS
  // sehingga bisa insert participant lain selain diri sendiri
  const { data, error } = await (supabase as any).rpc('create_direct_chat', {
    participant_ids: participants,
  });
  if (error) return { data: null, error };
  // RPC mengembalikan array, ambil elemen pertama
  const chatData = Array.isArray(data) ? data[0] : data;
  return { data: chatData, error: null };
};

export const createGroupChat = async (name: string, participantIds: string[], createdBy: string, avatarUrl?: string) => {
  const { data: chatData, error: chatError } = await (supabase as any)
    .from('chats')
    .insert({ is_group: true, name, avatar_url: avatarUrl || null, created_by: createdBy })
    .select()
    .single();

  if (chatError || !chatData) return { data: null, error: chatError };

  const allParticipants = Array.from(new Set([createdBy, ...participantIds]));
  const participantInserts = allParticipants.map(uid => ({ chat_id: chatData.id, user_id: uid }));
  const { error: participantsError } = await (supabase as any).from('chat_participants').insert(participantInserts);
  return { data: chatData, error: participantsError };
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const clearChat = async (chatId: string) => {
  const { error } = await supabase
    .from('chats')
    .update({ reset_at: new Date().toISOString() })
    .eq('id', chatId);
  return { error };
};

export const getMessages = async (chatId: string, resetAt?: string | null) => {
  let query = supabase
    .from('messages')
    .select(`*, sender:sender_id (id, email, display_name, avatar_url, public_key, online, last_seen)`)
    .eq('chat_id', chatId);

  if (resetAt) {
    query = query.gt('created_at', resetAt);
  }

  const { data, error } = await query.order('created_at', { ascending: true });
  return { data, error };
};

export const sendMessage = async (message: {
  chat_id: string;
  sender_id: string;
  type: 'text' | 'voice' | 'call' | 'image' | 'video' | 'poll';
  ciphertext?: string;
  iv?: string;
  hash?: string;
  expires_at?: string | null;
  is_delivered?: boolean;
}) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...message, is_delivered: message.is_delivered || false })
    .select()
    .single();
  return { data, error };
};

export const markMessagesAsDelivered = async (chatId: string, userId: string) => {
  const { error } = await (supabase as any)
    .from('messages')
    .update({ is_delivered: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('is_delivered', false);
  return { error };
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const { error } = await (supabase as any)
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('is_read', false);
  return { error };
};

export const getOtherParticipant = async (chatId: string, userId: string) => {
  const { data, error } = await supabase
    .from('chat_participants')
    .select(`user_id, profile:user_id (id, email, display_name, avatar_url, public_key, online, last_seen)`)
    .eq('chat_id', chatId)
    .neq('user_id', userId)
    .single();
  return { data, error };
};

// ─── Status / Stories ─────────────────────────────────────────────────────────
// Using (supabase as any) because 'statuses' table is not in the generated Database type yet

export const createStatus = async (userId: string, content: string, mediaUrl?: string, mediaType = 'text'): Promise<{ data: any; error: any }> => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await (supabase as any)
    .from('statuses')
    .insert({
      user_id: userId,
      content,
      media_url: mediaUrl || null,
      media_type: mediaType,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();
  if (error) console.error('createStatus DB error:', JSON.stringify(error));
  return { data, error };
};

export const deleteExpiredStatuses = async (userId: string) => {
  try {
    const now = new Date().toISOString();
    // 1. Ambil status yang sudah kadaluarsa milik user ini
    const { data: expired } = await (supabase as any)
      .from('statuses')
      .select('id, media_url, media_type')
      .eq('user_id', userId)
      .lt('expires_at', now);

    if (expired && expired.length > 0) {
      for (const status of expired) {
        // 2. Jika ada media, hapus dari Storage
        if (status.media_url) {
          try {
            const bucket = status.media_type === 'video' ? 'vidio' : 'image';
            const urlParts = status.media_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            // Path biasanya {userId}/{timestamp}.{ext} berdasarkan uploadImage/Video
            const path = `${userId}/${fileName.split('?')[0]}`;
            await supabase.storage.from(bucket).remove([path]);
            console.log(`Deleted storage file: ${bucket}/${path}`);
          } catch (storageErr) {
            console.error('Failed to delete story media from storage:', storageErr);
          }
        }
        // 3. Hapus baris dari Database
        await (supabase as any).from('statuses').delete().eq('id', status.id);
      }
      return true;
    }
  } catch (err) {
    console.error('Error in deleteExpiredStatuses:', err);
  }
  return false;
};

export const getActiveStatuses = async () => {
  const { data, error } = await (supabase as any)
    .from('statuses')
    .select(`*, profile:user_id (id, email, display_name, avatar_url)`)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return { data, error };
};

export const deleteStatus = async (statusId: string) => {
  const { error } = await (supabase as any).from('statuses').delete().eq('id', statusId);
  return { error };
};

// ─── Polls ────────────────────────────────────────────────────────────────────

export const createPoll = async (poll: {
  chat_id: string;
  creator_id: string;
  question: string;
  multiple_choice?: boolean;
  options: string[];
}) => {
  const { data: pollData, error: pollError } = await (supabase as any)
    .from('polls')
    .insert({
      chat_id: poll.chat_id,
      creator_id: poll.creator_id,
      question: poll.question,
      multiple_choice: poll.multiple_choice || false
    })
    .select()
    .single();

  if (pollError) return { error: pollError };

  const optionsToInsert = poll.options.map(text => ({
    poll_id: pollData.id,
    text
  }));

  const { error: optionsError } = await (supabase as any)
    .from('poll_options')
    .insert(optionsToInsert);

  return { data: pollData, error: optionsError };
};

export const getPollResults = async (pollId: string, userId: string): Promise<{ data: Poll | null, error: any }> => {
  const { data: poll, error: pollError } = await (supabase as any)
    .from('polls')
    .select(`
      *,
      options:poll_options(*),
      votes:poll_votes(option_id)
    `)
    .eq('id', pollId)
    .single();

  if (pollError) return { data: null, error: pollError };

  // Count votes per option
  const optionsWithCounts = poll.options.map((opt: any) => ({
    ...opt,
    _count: poll.votes.filter((v: any) => v.option_id === opt.id).length
  }));

  // Check my vote
  const myVote = await (supabase as any)
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .maybeSingle();

  return {
    data: {
      ...poll,
      options: optionsWithCounts,
      my_vote: myVote.data?.option_id
    },
    error: null
  };
};

export const voteInPoll = async (pollId: string, optionId: string, userId: string) => {
  // Check if already voted
  const { data: existing } = await (supabase as any)
    .from('poll_votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Change vote
    return await (supabase as any)
      .from('poll_votes')
      .update({ option_id: optionId })
      .eq('id', existing.id);
  } else {
    // New vote
    return await (supabase as any)
      .from('poll_votes')
      .insert({ poll_id: pollId, option_id: optionId, user_id: userId });
  }
};

// ─── Reactions ────────────────────────────────────────────────────────────────

export const addMessageReaction = async (messageId: string, userId: string, emoji: string) => {
  if (!emoji) {
    // Remove individual reaction
    return await (supabase as any)
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);
  }

  // Explicit upsert targeting the unique constraint
  return await (supabase as any)
    .from('message_reactions')
    .upsert(
      { message_id: messageId, user_id: userId, emoji },
      { onConflict: 'message_id,user_id' }
    )
    .select()
    .single();
};

export const getMessageReactions = async (chatId: string) => {
  // Get all reactions for messages in a specific chat
  const { data, error } = await (supabase as any)
    .from('message_reactions')
    .select(`
      *,
      message:message_id (chat_id)
    `)
    .eq('message.chat_id', chatId);

  return { data, error };
};

export const subscribeToReactions = (chatId: string, callback: (payload: any) => void) => {
  // We need to filter reactions that belong to this chat
  // Simplest is to subscribe to all and filter in callback or check if we can join
  return supabase
    .channel(`reactions:${chatId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'message_reactions'
    }, callback)
    .subscribe();
};

// ─── Calls ────────────────────────────────────────────────────────────────────

export const createCall = async (call: {
  chat_id: string;
  caller_id: string;
  type: 'voice' | 'video';
  offer?: any;
}) => {
  const { data, error } = await supabase
    .from('calls')
    .insert({ ...call, status: 'ringing', offer: call.offer || null })
    .select()
    .single();
  return { data, error };
};

export const updateCall = async (callId: string, updates: {
  answer?: any;
  status?: 'ringing' | 'connected' | 'ended' | 'declined';
  offer?: any;
}) => {
  const { data, error } = await supabase
    .from('calls')
    .update(updates)
    .eq('id', callId)
    .select()
    .single();
  return { data, error };
};

export const getActiveCall = async (chatId: string) => {
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('chat_id', chatId)
    .in('status', ['ringing', 'connected'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return { data, error };
};

// ─── Realtime Subscriptions ───────────────────────────────────────────────────

export const subscribeToMessages = (chatId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${chatId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, callback)
    .subscribe();
};

export const subscribeToCalls = (chatId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`calls:${chatId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `chat_id=eq.${chatId}` }, callback)
    .subscribe();
};

export const subscribeToProfile = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`profiles:${userId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, callback)
    .subscribe();
};

// ─── Friendships ─────────────────────────────────────────────────────────────

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  // Check if request already exists in either direction
  const { data: existing } = await (supabase as any)
    .from('friendships')
    .select('id, status')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') return { data: existing, error: { message: 'Sudah berteman' } };
    return { data: existing, error: { message: 'Permintaan sudah ada' } };
  }

  const { data, error } = await (supabase as any)
    .from('friendships')
    .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' })
    .select()
    .single();
  return { data, error };
};

export const getFriends = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('friendships')
    .select(`
      *,
      sender:sender_id (id, email, display_name, avatar_url, online, last_seen),
      receiver:receiver_id (id, email, display_name, avatar_url, online, last_seen)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');
  return { data, error };
};

export const getPendingRequests = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('friendships')
    .select(`
      *,
      sender:sender_id (id, email, display_name, avatar_url, online, last_seen)
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending');
  return { data, error };
};

export const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
  const { data, error } = await (supabase as any)
    .from('friendships')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();
  return { data, error };
};

export const removeFriend = async (friendshipId: string) => {
  const { error } = await (supabase as any)
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  return { error };
};

export const checkFriendship = async (user1: string, user2: string) => {
  const { data, error } = await (supabase as any)
    .from('friendships')
    .select('status')
    .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
    .eq('status', 'accepted')
    .single();
  return { isFriend: !!data && !error };
};
