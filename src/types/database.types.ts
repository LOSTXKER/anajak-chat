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
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'admin' | 'agent' | 'viewer'
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'agent' | 'viewer'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'agent' | 'viewer'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          business_id: string
          type: 'facebook' | 'instagram' | 'line' | 'tiktok' | 'shopee' | 'web' | 'email'
          name: string
          config: Json
          status: 'connected' | 'disconnected' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          type: 'facebook' | 'instagram' | 'line' | 'tiktok' | 'shopee' | 'web' | 'email'
          name: string
          config?: Json
          status?: 'connected' | 'disconnected' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          type?: 'facebook' | 'instagram' | 'line' | 'tiktok' | 'shopee' | 'web' | 'email'
          name?: string
          config?: Json
          status?: 'connected' | 'disconnected' | 'error'
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          business_id: string
          name: string | null
          email: string | null
          phone: string | null
          avatar: string | null
          metadata: Json | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          avatar?: string | null
          metadata?: Json | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          avatar?: string | null
          metadata?: Json | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          business_id: string
          contact_id: string
          channel_id: string
          status: 'open' | 'claimed' | 'resolved' | 'archived'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          claimed_at: string | null
          resolved_at: string | null
          last_message_at: string | null
          sla_due_at: string | null
          risk_level: 'none' | 'low' | 'medium' | 'high'
          tags: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          contact_id: string
          channel_id: string
          status?: 'open' | 'claimed' | 'resolved' | 'archived'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          claimed_at?: string | null
          resolved_at?: string | null
          last_message_at?: string | null
          sla_due_at?: string | null
          risk_level?: 'none' | 'low' | 'medium' | 'high'
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          contact_id?: string
          channel_id?: string
          status?: 'open' | 'claimed' | 'resolved' | 'archived'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          claimed_at?: string | null
          resolved_at?: string | null
          last_message_at?: string | null
          sla_due_at?: string | null
          risk_level?: 'none' | 'low' | 'medium' | 'high'
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          business_id: string
          sender_type: 'contact' | 'agent' | 'bot' | 'system'
          sender_id: string | null
          content: string
          content_type: 'text' | 'image' | 'file' | 'audio' | 'video'
          metadata: Json | null
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          business_id: string
          sender_type: 'contact' | 'agent' | 'bot' | 'system'
          sender_id?: string | null
          content: string
          content_type?: 'text' | 'image' | 'file' | 'audio' | 'video'
          metadata?: Json | null
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          business_id?: string
          sender_type?: 'contact' | 'agent' | 'bot' | 'system'
          sender_id?: string | null
          content?: string
          content_type?: 'text' | 'image' | 'file' | 'audio' | 'video'
          metadata?: Json | null
          is_internal?: boolean
          created_at?: string
        }
      }
      entities: {
        Row: {
          id: string
          business_id: string
          type: string
          title: string
          description: string | null
          status: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          value: number | null
          currency: string | null
          owner_id: string | null
          conversation_id: string | null
          contact_id: string | null
          due_date: string | null
          completed_at: string | null
          metadata: Json | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          type: string
          title: string
          description?: string | null
          status: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          value?: number | null
          currency?: string | null
          owner_id?: string | null
          conversation_id?: string | null
          contact_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          type?: string
          title?: string
          description?: string | null
          status?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          value?: number | null
          currency?: string | null
          owner_id?: string | null
          conversation_id?: string | null
          contact_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          business_id: string
          entity_id: string | null
          conversation_id: string | null
          name: string
          size: number
          mime_type: string
          storage_path: string
          uploaded_by: string
          version: number
          status: 'pending' | 'approved' | 'rejected'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          entity_id?: string | null
          conversation_id?: string | null
          name: string
          size: number
          mime_type: string
          storage_path: string
          uploaded_by: string
          version?: number
          status?: 'pending' | 'approved' | 'rejected'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          entity_id?: string | null
          conversation_id?: string | null
          name?: string
          size?: number
          mime_type?: string
          storage_path?: string
          uploaded_by?: string
          version?: number
          status?: 'pending' | 'approved' | 'rejected'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_memories: {
        Row: {
          id: string
          business_id: string
          category: 'tone' | 'policy' | 'pricing' | 'product' | 'process' | 'custom'
          key: string
          value: string
          metadata: Json | null
          version: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          category: 'tone' | 'policy' | 'pricing' | 'product' | 'process' | 'custom'
          key: string
          value: string
          metadata?: Json | null
          version?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          category?: 'tone' | 'policy' | 'pricing' | 'product' | 'process' | 'custom'
          key?: string
          value?: string
          metadata?: Json | null
          version?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}

