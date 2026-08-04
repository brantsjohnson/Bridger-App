// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the auto-generated "shape of the database" for TypeScript. It lists
// every table, every column, and every allowed enum value exactly as they exist
// in Supabase, so the app and API get red squiggles if they ever read/write a
// column that doesn't exist or use a wrong tier/status value.
//
// DO NOT EDIT BY HAND. It is generated from the live database. To refresh it
// after a migration, regenerate the types from Supabase (see infra/supabase/
// README notes) and paste the result here.
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_hearts: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_hearts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "activity_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_hearts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_posts: {
        Row: {
          activity_id: string
          author_id: string
          created_at: string
          id: string
          media_id: string | null
        }
        Insert: {
          activity_id: string
          author_id: string
          created_at?: string
          id?: string
          media_id?: string | null
        }
        Update: {
          activity_id?: string
          author_id?: string
          created_at?: string
          id?: string
          media_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_posts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "weekly_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_posts_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_config: {
        Row: {
          home_defaults: Json
          id: string
          live_quiz_slug: string | null
          themed_prompts: Json
          updated_at: string
        }
        Insert: {
          home_defaults?: Json
          id?: string
          live_quiz_slug?: string | null
          themed_prompts?: Json
          updated_at?: string
        }
        Update: {
          home_defaults?: Json
          id?: string
          live_quiz_slug?: string | null
          themed_prompts?: Json
          updated_at?: string
        }
        Relationships: []
      }
      attributes: {
        Row: {
          created_at: string
          id: string
          key: string
          layer: Database["public"]["Enums"]["attr_layer"]
          matchable: boolean
          owner_id: string
          updated_at: string
          value: Json
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          layer: Database["public"]["Enums"]["attr_layer"]
          matchable?: boolean
          owner_id: string
          updated_at?: string
          value?: Json
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          layer?: Database["public"]["Enums"]["attr_layer"]
          matchable?: boolean
          owner_id?: string
          updated_at?: string
          value?: Json
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "attributes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list: {
        Row: {
          created_at: string
          done: boolean
          id: string
          is_public: boolean
          owner_id: string
          text: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          is_public?: boolean
          owner_id: string
          text: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          is_public?: boolean
          owner_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list_tags: {
        Row: {
          item_id: string
          tagged_user_id: string
        }
        Insert: {
          item_id: string
          tagged_user_id: string
        }
        Update: {
          item_id?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "bucket_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bucket_list_tags_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          made_via: Database["public"]["Enums"]["made_via"] | null
          met_approx_geo: string | null
          met_at: string | null
          met_context: Database["public"]["Enums"]["met_context"] | null
          met_event_id: string | null
          met_place_label: string | null
          mutual_friend_id: string | null
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          made_via?: Database["public"]["Enums"]["made_via"] | null
          met_approx_geo?: string | null
          met_at?: string | null
          met_context?: Database["public"]["Enums"]["met_context"] | null
          met_event_id?: string | null
          met_place_label?: string | null
          mutual_friend_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          made_via?: Database["public"]["Enums"]["made_via"] | null
          met_approx_geo?: string | null
          met_at?: string | null
          met_context?: Database["public"]["Enums"]["met_context"] | null
          met_event_id?: string | null
          met_place_label?: string | null
          mutual_friend_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_mutual_friend_id_fkey"
            columns: ["mutual_friend_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_connections_met_event"
            columns: ["met_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_announcements: {
        Row: {
          body: string
          id: string
          published_at: string | null
        }
        Insert: {
          body: string
          id?: string
          published_at?: string | null
        }
        Update: {
          body?: string
          id?: string
          published_at?: string | null
        }
        Relationships: []
      }
      coop_memberships: {
        Row: {
          active: boolean
          created_at: string
          dues_paid_through: string | null
          since: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dues_paid_through?: string | null
          since?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dues_paid_through?: string | null
          since?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      day_summaries: {
        Row: {
          author_id: string
          built_at: string
          date: string
          id: string
          media_refs: Json
          text: string | null
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          author_id: string
          built_at?: string
          date: string
          id?: string
          media_refs?: Json
          text?: string | null
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          author_id?: string
          built_at?: string
          date?: string
          id?: string
          media_refs?: Json
          text?: string | null
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "day_summaries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      delights: {
        Row: {
          enabled: boolean
          id: string
          schedule: Json
          scope: Database["public"]["Enums"]["delight_scope"]
        }
        Insert: {
          enabled?: boolean
          id?: string
          schedule?: Json
          scope?: Database["public"]["Enums"]["delight_scope"]
        }
        Update: {
          enabled?: boolean
          id?: string
          schedule?: Json
          scope?: Database["public"]["Enums"]["delight_scope"]
        }
        Relationships: []
      }
      event_intros: {
        Row: {
          a: string
          b: string
          created_at: string
          event_id: string
          id: string
          why: string | null
        }
        Insert: {
          a: string
          b: string
          created_at?: string
          event_id: string
          id?: string
          why?: string | null
        }
        Update: {
          a?: string
          b?: string
          created_at?: string
          event_id?: string
          id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_intros_a_fkey"
            columns: ["a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_intros_b_fkey"
            columns: ["b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_intros_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          allergies_optin: boolean
          allergies_text: string | null
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["event_invite_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies_optin?: boolean
          allergies_text?: string | null
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["event_invite_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies_optin?: boolean
          allergies_text?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["event_invite_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          allow_friends_invite: boolean
          bio: string | null
          bring: string | null
          cap: number
          chip_in: Json | null
          co_host_ids: string[]
          created_at: string
          host_id: string
          id: string
          place: string | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_friends_invite?: boolean
          bio?: string | null
          bring?: string | null
          cap?: number
          chip_in?: Json | null
          co_host_ids?: string[]
          created_at?: string
          host_id: string
          id?: string
          place?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_friends_invite?: boolean
          bio?: string | null
          bring?: string | null
          cap?: number
          chip_in?: Json | null
          co_host_ids?: string[]
          created_at?: string
          host_id?: string
          id?: string
          place?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_notes: {
        Row: {
          author_id: string
          created_at: string
          date: string | null
          id: string
          kind: Database["public"]["Enums"]["friend_note_kind"]
          person_id: string
          remind: boolean
          text: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["friend_note_kind"]
          person_id: string
          remind?: boolean
          text?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["friend_note_kind"]
          person_id?: string
          remind?: boolean
          text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_notes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_links: {
        Row: {
          created_at: string
          expires_at: string | null
          owner_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          owner_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          owner_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          owner_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          owner_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          owner_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          provider_ref: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          provider_ref?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          provider_ref?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      person_embeddings: {
        Row: {
          embedding: string | null
          model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          embedding?: string | null
          model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          embedding?: string | null
          model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      person_summaries: {
        Row: {
          maybe_stale: boolean
          summary_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          maybe_stale?: boolean
          summary_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          maybe_stale?: boolean
          summary_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_state: {
        Row: {
          circle_caps: Json
          created_at: string
          event_cap: number
          plan: Database["public"]["Enums"]["coop_plan"]
          storage: Database["public"]["Enums"]["storage_plan"]
          summary: Database["public"]["Enums"]["summary_cadence"]
          updated_at: string
          used_bytes: number
          user_id: string
          video: boolean
        }
        Insert: {
          circle_caps?: Json
          created_at?: string
          event_cap?: number
          plan?: Database["public"]["Enums"]["coop_plan"]
          storage?: Database["public"]["Enums"]["storage_plan"]
          summary?: Database["public"]["Enums"]["summary_cadence"]
          updated_at?: string
          used_bytes?: number
          user_id: string
          video?: boolean
        }
        Update: {
          circle_caps?: Json
          created_at?: string
          event_cap?: number
          plan?: Database["public"]["Enums"]["coop_plan"]
          storage?: Database["public"]["Enums"]["storage_plan"]
          summary?: Database["public"]["Enums"]["summary_cadence"]
          updated_at?: string
          used_bytes?: number
          user_id?: string
          video?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plan_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          id: string
          label: string
          poll_id: string
        }
        Insert: {
          id?: string
          label: string
          poll_id: string
        }
        Update: {
          id?: string
          label?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          author_id: string
          closes_at: string | null
          created_at: string
          id: string
          question: string
        }
        Insert: {
          author_id: string
          closes_at?: string | null
          created_at?: string
          id?: string
          question: string
        }
        Update: {
          author_id?: string
          closes_at?: string | null
          created_at?: string
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          owner_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          owner_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          owner_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_tokens_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quip_tags: {
        Row: {
          quip_id: string
          tagged_user_id: string
        }
        Insert: {
          quip_id: string
          tagged_user_id: string
        }
        Update: {
          quip_id?: string
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quip_tags_quip_id_fkey"
            columns: ["quip_id"]
            isOneToOne: false
            referencedRelation: "quips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quip_tags_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quips: {
        Row: {
          author_id: string
          context_event_id: string | null
          created_at: string
          id: string
          place: string | null
          quoted_person_id: string | null
          text: string
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          author_id: string
          context_event_id?: string | null
          created_at?: string
          id?: string
          place?: string | null
          quoted_person_id?: string | null
          text: string
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          author_id?: string
          context_event_id?: string | null
          created_at?: string
          id?: string
          place?: string | null
          quoted_person_id?: string | null
          text?: string
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_quips_context_event"
            columns: ["context_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quips_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quips_quoted_person_id_fkey"
            columns: ["quoted_person_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          allow_explain: boolean
          id: string
          options: Json
          prompt: string
          quiz_id: string
          type: Database["public"]["Enums"]["quiz_question_type"]
        }
        Insert: {
          allow_explain?: boolean
          id?: string
          options?: Json
          prompt: string
          quiz_id: string
          type?: Database["public"]["Enums"]["quiz_question_type"]
        }
        Update: {
          allow_explain?: boolean
          id?: string
          options?: Json
          prompt?: string
          quiz_id?: string
          type?: Database["public"]["Enums"]["quiz_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_registry: {
        Row: {
          created_at: string
          friends_taken_count: number
          live_week: string | null
          slug: string
          status: Database["public"]["Enums"]["quiz_status"]
          title: string
        }
        Insert: {
          created_at?: string
          friends_taken_count?: number
          live_week?: string | null
          slug: string
          status?: Database["public"]["Enums"]["quiz_status"]
          title: string
        }
        Update: {
          created_at?: string
          friends_taken_count?: number
          live_week?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["quiz_status"]
          title?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          created_at: string
          explain_text: string | null
          id: string
          question_id: string
          quiz_id: string
          selected_option_ids: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          explain_text?: string | null
          id?: string
          question_id: string
          quiz_id: string
          selected_option_ids?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          explain_text?: string | null
          id?: string
          question_id?: string
          quiz_id?: string
          selected_option_ids?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          completed_at: string
          confidence: Json
          dimension_scores: Json
          id: string
          quiz_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          confidence?: Json
          dimension_scores?: Json
          id?: string
          quiz_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          confidence?: Json
          dimension_scores?: Json
          id?: string
          quiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          adaptation_policy: Json
          created_at: string
          dimensions: Json
          goal: string | null
          id: string
          moderator_instructions: string | null
          version: number
        }
        Insert: {
          adaptation_policy?: Json
          created_at?: string
          dimensions?: Json
          goal?: string | null
          id?: string
          moderator_instructions?: string | null
          version?: number
        }
        Update: {
          adaptation_policy?: Json
          created_at?: string
          dimensions?: Json
          goal?: string | null
          id?: string
          moderator_instructions?: string | null
          version?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          author_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          media_id: string | null
          parent_reaction_id: string | null
          sticker_id: string | null
          story_id: string
          text: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          media_id?: string | null
          parent_reaction_id?: string | null
          sticker_id?: string | null
          story_id: string
          text?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          media_id?: string | null
          parent_reaction_id?: string | null
          sticker_id?: string | null
          story_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_parent_reaction_id_fkey"
            columns: ["parent_reaction_id"]
            isOneToOne: false
            referencedRelation: "reactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string
          created_at: string
          expires_at: string | null
          id: string
          media_id: string | null
          theme_slug: string | null
          transcript: string | null
          type: Database["public"]["Enums"]["story_type"]
          update_text: string | null
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          author_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          media_id?: string | null
          theme_slug?: string | null
          transcript?: string | null
          type: Database["public"]["Enums"]["story_type"]
          update_text?: string | null
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          author_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          media_id?: string | null
          theme_slug?: string | null
          transcript?: string | null
          type?: Database["public"]["Enums"]["story_type"]
          update_text?: string | null
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_skips: {
        Row: {
          blocker_id: string
          created_at: string
          skipped_id: string
        }
        Insert: {
          blocker_id: string
          created_at?: string
          skipped_id: string
        }
        Update: {
          blocker_id?: string
          created_at?: string
          skipped_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_skips_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_skips_skipped_id_fkey"
            columns: ["skipped_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          created_at: string
          other_id: string
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          other_id: string
          tier: Database["public"]["Enums"]["tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          other_id?: string
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiers_other_id_fkey"
            columns: ["other_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      touch_grass: {
        Row: {
          audience_tier: Database["public"]["Enums"]["tier"]
          author_id: string
          created_at: string
          id: string
          when_window: Database["public"]["Enums"]["touch_grass_when"]
          why: string | null
        }
        Insert: {
          audience_tier?: Database["public"]["Enums"]["tier"]
          author_id: string
          created_at?: string
          id?: string
          when_window: Database["public"]["Enums"]["touch_grass_when"]
          why?: string | null
        }
        Update: {
          audience_tier?: Database["public"]["Enums"]["tier"]
          author_id?: string
          created_at?: string
          id?: string
          when_window?: Database["public"]["Enums"]["touch_grass_when"]
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "touch_grass_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contacts: {
        Row: {
          email: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          email?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          email?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identity: {
        Row: {
          avatar_media_id: string | null
          display_name: string | null
          profile_song: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_media_id?: string | null
          display_name?: string | null
          profile_song?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_media_id?: string | null
          display_name?: string | null
          profile_song?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_identity_avatar"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          discoverable: boolean
          home_city: string | null
          locale: string | null
          meet_scope: string
          notif_prefs: Json
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          discoverable?: boolean
          home_city?: string | null
          locale?: string | null
          meet_scope?: string
          notif_prefs?: Json
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          discoverable?: boolean
          home_city?: string | null
          locale?: string | null
          meet_scope?: string
          notif_prefs?: Json
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider: string | null
          created_at: string
          id: string
          status: string
        }
        Insert: {
          auth_provider?: string | null
          created_at?: string
          id: string
          status?: string
        }
        Update: {
          auth_provider?: string | null
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      weekly_activities: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string | null
          id: string
          prompt: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          prompt?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          prompt?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view: {
        Args: {
          p_owner: string
          p_required: Database["public"]["Enums"]["tier"]
        }
        Returns: boolean
      }
    }
    Enums: {
      attr_layer: "essential" | "profile" | "connection"
      connection_status: "pending" | "accepted"
      coop_plan: "free" | "coop"
      delight_scope: "global" | "opt-in" | "gift"
      event_invite_status: "going" | "cant" | "invited"
      friend_note_kind: "text" | "date"
      made_via: "link" | "qr" | "add" | "suggestion"
      media_kind: "photo" | "video" | "audio"
      met_context: "event" | "place" | "mutual" | "qr" | "link"
      payment_kind: "coop_dues"
      quiz_question_type: "single" | "multi"
      quiz_status: "live" | "draft" | "archived"
      reaction_kind: "circleVideo" | "text" | "sticker"
      storage_plan: "rolling30" | "unlimited"
      story_type: "photo" | "video"
      summary_cadence: "weekly" | "daily"
      tier: "none" | "acquaintance" | "friend" | "close"
      touch_grass_when: "now" | "tonight" | "weekend"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attr_layer: ["essential", "profile", "connection"],
      connection_status: ["pending", "accepted"],
      coop_plan: ["free", "coop"],
      delight_scope: ["global", "opt-in", "gift"],
      event_invite_status: ["going", "cant", "invited"],
      friend_note_kind: ["text", "date"],
      made_via: ["link", "qr", "add", "suggestion"],
      media_kind: ["photo", "video", "audio"],
      met_context: ["event", "place", "mutual", "qr", "link"],
      payment_kind: ["coop_dues"],
      quiz_question_type: ["single", "multi"],
      quiz_status: ["live", "draft", "archived"],
      reaction_kind: ["circleVideo", "text", "sticker"],
      storage_plan: ["rolling30", "unlimited"],
      story_type: ["photo", "video"],
      summary_cadence: ["weekly", "daily"],
      tier: ["none", "acquaintance", "friend", "close"],
      touch_grass_when: ["now", "tonight", "weekend"],
    },
  },
} as const
