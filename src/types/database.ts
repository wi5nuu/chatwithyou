export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          public_key: string | null
          created_at: string
          online: boolean | null
          last_seen: string | null
        }
        Insert: {
          id: string
          email?: string | null
          public_key?: string | null
          created_at?: string
          online?: boolean | null
          last_seen?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          public_key?: string | null
          created_at?: string
          online?: boolean | null
          last_seen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chats: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          chat_id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          user_id: string
        }
        Update: {
          chat_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          type: string
          ciphertext: string | null
          iv: string | null
          hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          type: string
          ciphertext?: string | null
          iv?: string | null
          hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          type?: string
          ciphertext?: string | null
          iv?: string | null
          hash?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      calls: {
        Row: {
          id: string
          chat_id: string
          caller_id: string
          offer: Json | null
          answer: Json | null
          status: string | null
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          caller_id: string
          offer?: Json | null
          answer?: Json | null
          status?: string | null
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          caller_id?: string
          offer?: Json | null
          answer?: Json | null
          status?: string | null
          type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
