// LoveChat Type Definitions

export interface Profile {
  id: string;
  email: string | null;
  public_key: string | null;
  created_at: string;
  online: boolean | null;
  last_seen: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  chat_wallpaper?: string | null;
}

export interface Chat {
  id: string;
  created_at: string;
  reset_at?: string | null;
  is_group?: boolean;
  name?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  participants?: ChatParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ChatParticipant {
  chat_id: string;
  user_id: string;
  profile?: Profile;
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'poll' | 'location';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  type: MessageType;
  ciphertext?: string;
  iv?: string;
  hash?: string;
  created_at: string;
  sender?: Profile;
  decrypted_content?: string;
  expires_at?: string | null;
  is_ai?: boolean;
  poll?: Poll;
  location?: { lat: number; lng: number; address?: string };
  is_read?: boolean;
}

export interface Call {
  id: string;
  chat_id: string;
  caller_id: string;
  offer: any;
  answer: any;
  status: 'ringing' | 'connected' | 'ended' | 'declined' | null;
  type: 'voice' | 'video';
  created_at: string;
  caller?: Profile;
}

export interface Status {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'text' | 'image' | 'video';
  expires_at: string;
  created_at: string;
  profile?: Profile;
}

export interface Poll {
  id: string;
  chat_id: string;
  creator_id: string;
  question: string;
  multiple_choice: boolean;
  created_at: string;
  options?: PollOption[];
  my_vote?: string; // option_id
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  _count?: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  hash: string;
}

export interface User {
  id: string;
  email: string;
  publicKey: string;
}
export interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}
