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
      jname_results: {
        Row: {
          user_id: string
          j_name: string
          percent: number
          top_names: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          j_name: string
          percent?: number
          top_names?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          j_name?: string
          percent?: number
          top_names?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      jname_shares: {
        Row: {
          token: string
          sharer_id: string
          j_name: string
          percent: number
          created_at: string
        }
        Insert: {
          token?: string
          sharer_id: string
          j_name: string
          percent?: number
          created_at?: string
        }
        Update: {
          token?: string
          sharer_id?: string
          j_name?: string
          percent?: number
          created_at?: string
        }
        Relationships: []
      }
      jname_referrals: {
        Row: {
          id: string
          token: string
          sharer_id: string
          invited_user_id: string | null
          anon_ref: string | null
          opened_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          token: string
          sharer_id: string
          invited_user_id?: string | null
          anon_ref?: string | null
          opened_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          sharer_id?: string
          invited_user_id?: string | null
          anon_ref?: string | null
          opened_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
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
          caption: string | null
          created_at: string
          emoji: string | null
          id: string
          media_id: string | null
        }
        Insert: {
          activity_id: string
          author_id: string
          caption?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          media_id?: string | null
        }
        Update: {
          activity_id?: string
          author_id?: string
          caption?: string | null
          created_at?: string
          emoji?: string | null
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
          demo_week: Json
          home_defaults: Json
          id: string
          live_quiz_slug: string | null
          themed_prompts: Json
          assistant: Json
          storage: Json
          updated_at: string
        }
        Insert: {
          demo_week?: Json
          home_defaults?: Json
          id?: string
          live_quiz_slug?: string | null
          themed_prompts?: Json
          assistant?: Json
          storage?: Json
          updated_at?: string
        }
        Update: {
          demo_week?: Json
          home_defaults?: Json
          id?: string
          live_quiz_slug?: string | null
          themed_prompts?: Json
          assistant?: Json
          storage?: Json
          updated_at?: string
        }
        Relationships: []
      }
      assistant_sessions: {
        Row: {
          id: string
          user_id: string
          status: string
          created_at: string
          closed_at: string | null
          fill_state: Json
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          created_at?: string
          closed_at?: string | null
          fill_state?: Json
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          created_at?: string
          closed_at?: string | null
          fill_state?: Json
        }
        Relationships: []
      }
      assistant_turns: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          tool_name: string | null
          created_at: string
          playbook_id: string | null
          playbook_version: string | null
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          tool_name?: string | null
          created_at?: string
          playbook_id?: string | null
          playbook_version?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          tool_name?: string | null
          created_at?: string
          playbook_id?: string | null
          playbook_version?: string | null
        }
        Relationships: []
      }
      assistant_activity_log: {
        Row: {
          id: string
          user_id: string
          tool: string
          summary: string
          undo_payload: Json | null
          created_at: string
          undone_at: string | null
          playbook_id: string | null
          playbook_version: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tool: string
          summary: string
          undo_payload?: Json | null
          created_at?: string
          undone_at?: string | null
          playbook_id?: string | null
          playbook_version?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tool?: string
          summary?: string
          undo_payload?: Json | null
          created_at?: string
          undone_at?: string | null
          playbook_id?: string | null
          playbook_version?: string | null
        }
        Relationships: []
      }
      assistant_memory_chunks: {
        Row: {
          id: string
          user_id: string
          kind: string
          ref_id: string | null
          text: string
          embedding: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: string
          ref_id?: string | null
          text: string
          embedding?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          ref_id?: string | null
          text?: string
          embedding?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assistant_proposals: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          tool: string
          preview: string
          args: Json
          status: string
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          tool: string
          preview: string
          args?: Json
          status?: string
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          tool?: string
          preview?: string
          args?: Json
          status?: string
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      assistant_scheduled_messages: {
        Row: {
          id: string
          user_id: string
          person_id: string
          body: string
          send_at: string
          status: string
          activity_id: string | null
          created_at: string
          cancelled_at: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          person_id: string
          body: string
          send_at: string
          status?: string
          activity_id?: string | null
          created_at?: string
          cancelled_at?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          person_id?: string
          body?: string
          send_at?: string
          status?: string
          activity_id?: string | null
          created_at?: string
          cancelled_at?: string | null
          sent_at?: string | null
        }
        Relationships: []
      }
      // --- AI System tables (migration 0028_ai_system.sql) ---
      ai_config: {
        Row: {
          job: string
          lane: string
          model_id: string
          temperature: number
          max_tokens: number
          timeout_ms: number
          schema_id: string | null
          monthly_budget_usd: number
          enabled: boolean
          updated_at: string
        }
        Insert: {
          job: string
          lane: string
          model_id: string
          temperature?: number
          max_tokens?: number
          timeout_ms?: number
          schema_id?: string | null
          monthly_budget_usd?: number
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          job?: string
          lane?: string
          model_id?: string
          temperature?: number
          max_tokens?: number
          timeout_ms?: number
          schema_id?: string | null
          monthly_budget_usd?: number
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_job_cost_log: {
        Row: {
          id: string
          job: string
          prompt_version: string | null
          latency_ms: number
          input_tokens: number
          output_tokens: number
          estimated_usd: number
          subject_ref: string
          created_at: string
        }
        Insert: {
          id?: string
          job: string
          prompt_version?: string | null
          latency_ms?: number
          input_tokens?: number
          output_tokens?: number
          estimated_usd?: number
          subject_ref: string
          created_at?: string
        }
        Update: {
          id?: string
          job?: string
          prompt_version?: string | null
          latency_ms?: number
          input_tokens?: number
          output_tokens?: number
          estimated_usd?: number
          subject_ref?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_ops_alerts: {
        Row: {
          id: string
          source: string
          code: string
          detail: string
          job: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          code: string
          detail?: string
          job?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          code?: string
          detail?: string
          job?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      billy_balances: {
        Row: {
          user_id: string
          balance_usd: number
          lifetime_granted_usd: number
          lifetime_spent_usd: number
          updated_at: string
        }
        Insert: {
          user_id: string
          balance_usd?: number
          lifetime_granted_usd?: number
          lifetime_spent_usd?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          balance_usd?: number
          lifetime_granted_usd?: number
          lifetime_spent_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      billy_config: {
        Row: {
          id: number
          taste_grant_usd: number
          plus_price_usd: number
          plus_grant_usd: number
          rollover_cap_multiplier: number
          taste_rollover: boolean
          min_balance_to_start_turn_usd: number
          updated_at: string
        }
        Insert: {
          id?: number
          taste_grant_usd?: number
          plus_price_usd?: number
          plus_grant_usd?: number
          rollover_cap_multiplier?: number
          taste_rollover?: boolean
          min_balance_to_start_turn_usd?: number
          updated_at?: string
        }
        Update: {
          id?: number
          taste_grant_usd?: number
          plus_price_usd?: number
          plus_grant_usd?: number
          rollover_cap_multiplier?: number
          taste_rollover?: boolean
          min_balance_to_start_turn_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      billy_ledger: {
        Row: {
          id: string
          user_id: string
          kind: string
          amount_usd: number
          balance_after_usd: number
          job: string | null
          cost_log_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: string
          amount_usd: number
          balance_after_usd: number
          job?: string | null
          cost_log_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          amount_usd?: number
          balance_after_usd?: number
          job?: string | null
          cost_log_id?: string | null
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      billy_subscriptions: {
        Row: {
          user_id: string
          plan: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          provider_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          provider_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          plan?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          provider_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          id: string
          job: string
          subject_ref: string
          content_hash: string
          payload_json: Json
          status: string
          attempts: number
          run_after: string
          last_error: string | null
          result_json: Json | null
          created_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          job: string
          subject_ref: string
          content_hash: string
          payload_json?: Json
          status?: string
          attempts?: number
          run_after?: string
          last_error?: string | null
          result_json?: Json | null
          created_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          job?: string
          subject_ref?: string
          content_hash?: string
          payload_json?: Json
          status?: string
          attempts?: number
          run_after?: string
          last_error?: string | null
          result_json?: Json | null
          created_at?: string
          finished_at?: string | null
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
      client_not_found_hits: {
        Row: {
          app_version: string | null
          created_at: string
          id: string
          missing_path: string
          path_trail: string[]
          platform: string | null
          reason: string
          session_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          id?: string
          missing_path: string
          path_trail?: string[]
          platform?: string | null
          reason?: string
          session_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          id?: string
          missing_path?: string
          path_trail?: string[]
          platform?: string | null
          reason?: string
          session_id?: string | null
        }
        Relationships: []
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
          met_note: string | null
          met_place_label: string | null
          met_via_user_id: string | null
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
          met_note?: string | null
          met_place_label?: string | null
          met_via_user_id?: string | null
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
          met_note?: string | null
          met_place_label?: string | null
          met_via_user_id?: string | null
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
          cta_label: string | null
          cta_url: string | null
          id: string
          published_at: string | null
          title: string | null
        }
        Insert: {
          body: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          published_at?: string | null
          title?: string | null
        }
        Update: {
          body?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          published_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      coop_memberships: {
        Row: {
          active: boolean
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          dues_paid_through: string | null
          provider: string | null
          provider_subscription_id: string | null
          stripe_customer_id: string | null
          since: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          dues_paid_through?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          stripe_customer_id?: string | null
          since?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          dues_paid_through?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          stripe_customer_id?: string | null
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
      coop_ideas: {
        Row: {
          id: string
          author_id: string
          title: string
          problem: string | null
          evidence: string | null
          drawbacks: string | null
          category: string
          status: string
          urgency: string | null
          impact: string | null
          cost_guess: string | null
          funding_model: string | null
          public: boolean
          support_count: number
          created_at: string
          updated_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          problem?: string | null
          evidence?: string | null
          drawbacks?: string | null
          category?: string
          status?: string
          urgency?: string | null
          impact?: string | null
          cost_guess?: string | null
          funding_model?: string | null
          public?: boolean
          support_count?: number
          created_at?: string
          updated_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          problem?: string | null
          evidence?: string | null
          drawbacks?: string | null
          category?: string
          status?: string
          urgency?: string | null
          impact?: string | null
          cost_guess?: string | null
          funding_model?: string | null
          public?: boolean
          support_count?: number
          created_at?: string
          updated_at?: string
          approved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coop_ideas_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_idea_supports: {
        Row: {
          idea_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          idea_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          idea_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_idea_supports_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "coop_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_idea_supports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_idea_comments: {
        Row: {
          id: string
          idea_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_idea_comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "coop_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_idea_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_beta_versions: {
        Row: {
          id: string
          label: string
          access_code_hash: string
          release_notes: string | null
          known_issues: string | null
          unfinished: string | null
          test_url: string | null
          status: string
          round_ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          access_code_hash: string
          release_notes?: string | null
          known_issues?: string | null
          unfinished?: string | null
          test_url?: string | null
          status?: string
          round_ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          access_code_hash?: string
          release_notes?: string | null
          known_issues?: string | null
          unfinished?: string | null
          test_url?: string | null
          status?: string
          round_ends_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      coop_beta_votes: {
        Row: {
          version_id: string
          user_id: string
          choice: string
          created_at: string
        }
        Insert: {
          version_id: string
          user_id: string
          choice: string
          created_at?: string
        }
        Update: {
          version_id?: string
          user_id?: string
          choice?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_beta_votes_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "coop_beta_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_beta_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_beta_unlocks: {
        Row: {
          version_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          version_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          version_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_beta_unlocks_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "coop_beta_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_beta_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_promo_codes: {
        Row: {
          id: string
          code: string
          label: string
          grant_months: number
          max_redemptions: number
          redeemed_count: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          label?: string
          grant_months?: number
          max_redemptions?: number
          redeemed_count?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          label?: string
          grant_months?: number
          max_redemptions?: number
          redeemed_count?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coop_promo_redemptions: {
        Row: {
          promo_code_id: string
          user_id: string
          redeemed_at: string
        }
        Insert: {
          promo_code_id: string
          user_id: string
          redeemed_at?: string
        }
        Update: {
          promo_code_id?: string
          user_id?: string
          redeemed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "coop_promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_promo_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_mission_principles: {
        Row: {
          id: string
          slug: string
          title: string
          body: string
          sort_order: number
        }
        Insert: {
          id?: string
          slug: string
          title: string
          body: string
          sort_order?: number
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          body?: string
          sort_order?: number
        }
        Relationships: []
      }
      coop_mission_supports: {
        Row: {
          principle_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          principle_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          principle_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_mission_supports_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "coop_mission_principles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_mission_supports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_economics_assumptions: {
        Row: {
          id: string
          category: string
          label: string
          monthly_cents: number
          notes: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          category: string
          label: string
          monthly_cents?: number
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          category?: string
          label?: string
          monthly_cents?: number
          notes?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      coop_roles: {
        Row: {
          id: string
          title: string
          responsibilities: string | null
          hours_week: string | null
          risks: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          title: string
          responsibilities?: string | null
          hours_week?: string | null
          risks?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          title?: string
          responsibilities?: string | null
          hours_week?: string | null
          risks?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      coop_dues_votes: {
        Row: {
          user_id: string
          amount_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          amount_cents: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          amount_cents?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_dues_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coop_waitlist: {
        Row: {
          id: string
          email_hmac: string | null
          user_id: string | null
          interest: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email_hmac?: string | null
          user_id?: string | null
          interest?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email_hmac?: string | null
          user_id?: string | null
          interest?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coop_waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      freshness_prompts: {
        Row: {
          user_id: string
          attribute_id: string | null
          question: string | null
          created_at: string
          answered_at: string | null
        }
        Insert: {
          user_id: string
          attribute_id?: string | null
          question?: string | null
          created_at?: string
          answered_at?: string | null
        }
        Update: {
          user_id?: string
          attribute_id?: string | null
          question?: string | null
          created_at?: string
          answered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freshness_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      delights: {
        Row: {
          enabled: boolean
          id: string
          kind: string
          name: string
          notes: string
          schedule: Json
          scope: Database["public"]["Enums"]["delight_scope"]
          slug: string | null
          status: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          notes?: string
          schedule?: Json
          scope?: Database["public"]["Enums"]["delight_scope"]
          slug?: string | null
          status?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          notes?: string
          schedule?: Json
          scope?: Database["public"]["Enums"]["delight_scope"]
          slug?: string | null
          status?: string
        }
        Relationships: []
      }
      delight_triggers: {
        Row: {
          created_at: string
          delight_id: string
          from_user_id: string
          id: string
          played: boolean
          to_user_id: string
        }
        Insert: {
          created_at?: string
          delight_id: string
          from_user_id: string
          id?: string
          played?: boolean
          to_user_id: string
        }
        Update: {
          created_at?: string
          delight_id?: string
          from_user_id?: string
          id?: string
          played?: boolean
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delight_triggers_delight_id_fkey"
            columns: ["delight_id"]
            isOneToOne: false
            referencedRelation: "delights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delight_triggers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delight_triggers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          /** Null = host invited this guest; else the attendee who invited them. */
          invited_by: string | null
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
          invited_by?: string | null
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
          invited_by?: string | null
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
            foreignKeyName: "event_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      event_assignments: {
        Row: {
          assignee_id: string | null
          created_at: string
          done: boolean
          event_id: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          done?: boolean
          event_id: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          done?: boolean
          event_id?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          cover: Json | null
          created_at: string
          host_id: string
          id: string
          place: string | null
          /** Repeat rule jsonb or null (one-off). */
          recurrence: Json | null
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
          cover?: Json | null
          created_at?: string
          host_id: string
          id?: string
          place?: string | null
          recurrence?: Json | null
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
          cover?: Json | null
          created_at?: string
          host_id?: string
          id?: string
          place?: string | null
          recurrence?: Json | null
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
      matching_config: {
        Row: {
          id: string
          version: number
          active: boolean
          weights: Json
          suggest_threshold: number
          spotlight_threshold: number
          min_shared_signals: number
          confidence_floor: number
          reveal_extras_max: number
          refresh_cap: number
          exploration_epsilon: number
          exploration_epsilon_cold: number
          bridge_cooldown_days: number
          ann_candidate_cap: number
          exposure_cap_pct: number
          exposure_hard_cap: number
          v2_enabled: boolean
          holdout_pct: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          version: number
          active?: boolean
          weights: Json
          suggest_threshold?: number
          spotlight_threshold?: number
          min_shared_signals?: number
          confidence_floor?: number
          reveal_extras_max?: number
          refresh_cap?: number
          exploration_epsilon?: number
          exploration_epsilon_cold?: number
          bridge_cooldown_days?: number
          ann_candidate_cap?: number
          exposure_cap_pct?: number
          exposure_hard_cap?: number
          v2_enabled?: boolean
          holdout_pct?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          version?: number
          active?: boolean
          weights?: Json
          suggest_threshold?: number
          spotlight_threshold?: number
          min_shared_signals?: number
          confidence_floor?: number
          reveal_extras_max?: number
          refresh_cap?: number
          exploration_epsilon?: number
          exploration_epsilon_cold?: number
          bridge_cooldown_days?: number
          ann_candidate_cap?: number
          exposure_cap_pct?: number
          exposure_hard_cap?: number
          v2_enabled?: boolean
          holdout_pct?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      matching_feedback: {
        Row: {
          id: string
          opaque_a: string
          opaque_b: string
          surface: string | null
          suggestion_id: string | null
          pair_features_snapshot: Json
          outcome: string
          weight: number
          created_at: string
          superseded_at: string | null
        }
        Insert: {
          id?: string
          opaque_a: string
          opaque_b: string
          surface?: string | null
          suggestion_id?: string | null
          pair_features_snapshot: Json
          outcome: string
          weight: number
          created_at?: string
          superseded_at?: string | null
        }
        Update: {
          id?: string
          opaque_a?: string
          opaque_b?: string
          surface?: string | null
          suggestion_id?: string | null
          pair_features_snapshot?: Json
          outcome?: string
          weight?: number
          created_at?: string
          superseded_at?: string | null
        }
        Relationships: []
      }
      matching_suggestions: {
        Row: {
          id: string
          viewer_id: string
          candidate_id: string
          surface: string
          event_id: string | null
          connection_id: string | null
          via_friend_id: string | null
          score: number
          breakdown: Json
          evidence: Json
          is_exploration: boolean
          is_spotlight: boolean
          feature_snapshot: Json
          created_at: string
          expires_at: string | null
          dismissed_at: string | null
          converted_connection_id: string | null
        }
        Insert: {
          id?: string
          viewer_id: string
          candidate_id: string
          surface: string
          event_id?: string | null
          connection_id?: string | null
          via_friend_id?: string | null
          score: number
          breakdown?: Json
          evidence?: Json
          is_exploration?: boolean
          is_spotlight?: boolean
          feature_snapshot: Json
          created_at?: string
          expires_at?: string | null
          dismissed_at?: string | null
          converted_connection_id?: string | null
        }
        Update: {
          id?: string
          viewer_id?: string
          candidate_id?: string
          surface?: string
          event_id?: string | null
          connection_id?: string | null
          via_friend_id?: string | null
          score?: number
          breakdown?: Json
          evidence?: Json
          is_exploration?: boolean
          is_spotlight?: boolean
          feature_snapshot?: Json
          created_at?: string
          expires_at?: string | null
          dismissed_at?: string | null
          converted_connection_id?: string | null
        }
        Relationships: []
      }
      module_moderator_notes: {
        Row: {
          id: string
          user_id: string
          module_key: string
          notes: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_key: string
          notes?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_key?: string
          notes?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_moderator_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_notes: {
        Row: {
          author_id: string
          cadence: string | null
          created_at: string
          date: string | null
          id: string
          kind: Database["public"]["Enums"]["friend_note_kind"]
          next_remind_at: string | null
          person_id: string | null
          pending_person_id: string | null
          remind: boolean
          text: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          cadence?: string | null
          created_at?: string
          date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["friend_note_kind"]
          next_remind_at?: string | null
          person_id?: string | null
          pending_person_id?: string | null
          remind?: boolean
          text?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          cadence?: string | null
          created_at?: string
          date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["friend_note_kind"]
          next_remind_at?: string | null
          person_id?: string | null
          pending_person_id?: string | null
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
          {
            foreignKeyName: "friend_notes_pending_person_id_fkey"
            columns: ["pending_person_id"]
            isOneToOne: false
            referencedRelation: "pending_people"
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
      music_connections: {
        Row: {
          access_expires_at: string | null
          access_token_enc: string | null
          connected_at: string
          id: string
          provider: string
          provider_user_id: string | null
          refresh_token_enc: string
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_token_enc?: string | null
          connected_at?: string
          id?: string
          provider: string
          provider_user_id?: string | null
          refresh_token_enc: string
          scopes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_token_enc?: string | null
          connected_at?: string
          id?: string
          provider?: string
          provider_user_id?: string | null
          refresh_token_enc?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      music_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          provider: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          provider: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          provider?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_oauth_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      music_picks: {
        Row: {
          album_name: string | null
          apple_music_id: string | null
          artist_name: string
          artwork_url: string | null
          created_at: string
          id: string
          isrc: string | null
          kind: string
          matchable: boolean
          owner_id: string
          preview_url: string | null
          spotify_id: string | null
          spotify_uri: string | null
          title: string
          updated_at: string
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          album_name?: string | null
          apple_music_id?: string | null
          artist_name?: string
          artwork_url?: string | null
          created_at?: string
          id?: string
          isrc?: string | null
          kind: string
          matchable?: boolean
          owner_id: string
          preview_url?: string | null
          spotify_id?: string | null
          spotify_uri?: string | null
          title: string
          updated_at?: string
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          album_name?: string | null
          apple_music_id?: string | null
          artist_name?: string
          artwork_url?: string | null
          created_at?: string
          id?: string
          isrc?: string | null
          kind?: string
          matchable?: boolean
          owner_id?: string
          preview_url?: string | null
          spotify_id?: string | null
          spotify_uri?: string | null
          title?: string
          updated_at?: string
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "music_picks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      music_taste_artists: {
        Row: {
          artist_id: string
          artist_name: string
          artwork_url: string | null
          id: string
          matchable: boolean
          owner_id: string
          provider: string
          rank: number | null
          synced_at: string
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          artist_id: string
          artist_name: string
          artwork_url?: string | null
          id?: string
          matchable?: boolean
          owner_id: string
          provider: string
          rank?: number | null
          synced_at?: string
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          artist_id?: string
          artist_name?: string
          artwork_url?: string | null
          id?: string
          matchable?: boolean
          owner_id?: string
          provider?: string
          rank?: number | null
          synced_at?: string
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "music_taste_artists_owner_id_fkey"
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
      pending_people: {
        Row: {
          id: string
          author_id: string
          phone_e164: string
          display_name: string | null
          merged_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          phone_e164: string
          display_name?: string | null
          merged_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          phone_e164?: string
          display_name?: string | null
          merged_user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_people_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_people_merged_user_id_fkey"
            columns: ["merged_user_id"]
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
      profile_greatest_hits: {
        Row: {
          after_module: string | null
          created_at: string
          id: string
          media_id: string
          owner_id: string
          placement_index: number
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          after_module?: string | null
          created_at?: string
          id?: string
          media_id: string
          owner_id: string
          placement_index: number
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          after_module?: string | null
          created_at?: string
          id?: string
          media_id?: string
          owner_id?: string
          placement_index?: number
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_greatest_hits_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_greatest_hits_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
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
          audience_tier: Database["public"]["Enums"]["tier"]
          author_id: string
          closes_at: string | null
          created_at: string
          id: string
          question: string
        }
        Insert: {
          audience_tier?: Database["public"]["Enums"]["tier"]
          author_id: string
          closes_at?: string | null
          created_at?: string
          id?: string
          question: string
        }
        Update: {
          audience_tier?: Database["public"]["Enums"]["tier"]
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
          comparable: boolean
          cover: Json | null
          created_at: string
          description: string | null
          friends_taken_count: number
          live_week: string | null
          quiz_id: string | null
          slug: string
          status: Database["public"]["Enums"]["quiz_status"]
          title: string
          web_takeable: boolean
        }
        Insert: {
          comparable?: boolean
          cover?: Json | null
          created_at?: string
          description?: string | null
          friends_taken_count?: number
          live_week?: string | null
          quiz_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["quiz_status"]
          title?: string
          web_takeable?: boolean
        }
        Update: {
          comparable?: boolean
          cover?: Json | null
          created_at?: string
          description?: string | null
          friends_taken_count?: number
          live_week?: string | null
          quiz_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["quiz_status"]
          title?: string
          web_takeable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quiz_registry_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
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
      /** One editable 8.5 x 11 Scrapbook page behind a `stories` row (0054). */
      scrapbook_pages: {
        Row: {
          aspect_ratio: number
          author_id: string
          background: Json
          created_at: string
          id: string
          layout_family: string | null
          layout_id: string | null
          revision: number
          story_id: string | null
          updated_at: string
        }
        Insert: {
          aspect_ratio?: number
          author_id: string
          background?: Json
          created_at?: string
          id?: string
          layout_family?: string | null
          layout_id?: string | null
          revision?: number
          story_id?: string | null
          updated_at?: string
        }
        Update: {
          aspect_ratio?: number
          author_id?: string
          background?: Json
          created_at?: string
          id?: string
          layout_family?: string | null
          layout_id?: string | null
          revision?: number
          story_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrapbook_pages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrapbook_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      /** Everything drawn on a page: photos, captions, stamps. Positions are 0..1 (0054). */
      scrapbook_elements: {
        Row: {
          created_at: string
          data: Json
          height: number
          id: string
          locked: boolean
          media_id: string | null
          page_id: string
          rotation: number
          slot: number | null
          source: string | null
          type: string
          user_modified: boolean
          width: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          created_at?: string
          data?: Json
          height: number
          id?: string
          locked?: boolean
          media_id?: string | null
          page_id: string
          rotation?: number
          slot?: number | null
          source?: string | null
          type: string
          user_modified?: boolean
          width: number
          x: number
          y: number
          z_index?: number
        }
        Update: {
          created_at?: string
          data?: Json
          height?: number
          id?: string
          locked?: boolean
          media_id?: string | null
          page_id?: string
          rotation?: number
          slot?: number | null
          source?: string | null
          type?: string
          user_modified?: boolean
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "scrapbook_elements_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrapbook_elements_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "scrapbook_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string
          created_at: string
          event_id: string | null
          expires_at: string | null
          id: string
          /** generated: created_at + 24 hours — leaves Home tray → Profile archive */
          live_until: string
          media_id: string | null
          /** the editable Scrapbook page behind this post; null = legacy one-photo post (0054) */
          page_id: string | null
          /** goes up every time the author changes the page after posting (0054) */
          revision: number
          theme_slug: string | null
          transcript: string | null
          type: Database["public"]["Enums"]["story_type"]
          update_text: string | null
          visible_to_tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          author_id: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          id?: string
          media_id?: string | null
          page_id?: string | null
          revision?: number
          theme_slug?: string | null
          transcript?: string | null
          type: Database["public"]["Enums"]["story_type"]
          update_text?: string | null
          visible_to_tier?: Database["public"]["Enums"]["tier"]
        }
        Update: {
          author_id?: string
          created_at?: string
          event_id?: string | null
          expires_at?: string | null
          id?: string
          media_id?: string | null
          page_id?: string | null
          revision?: number
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
            foreignKeyName: "stories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          expires_at: string | null
          id: string
          when_window: Database["public"]["Enums"]["touch_grass_when"]
          why: string | null
        }
        Insert: {
          audience_tier?: Database["public"]["Enums"]["tier"]
          author_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          when_window: Database["public"]["Enums"]["touch_grass_when"]
          why?: string | null
        }
        Update: {
          audience_tier?: Database["public"]["Enums"]["tier"]
          author_id?: string
          created_at?: string
          expires_at?: string | null
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
      touch_grass_responses: {
        Row: {
          created_at: string
          signal_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          signal_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          signal_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "touch_grass_responses_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "touch_grass"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touch_grass_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recap_weeks: {
        Row: {
          active: boolean
          created_at: string
          id: string
          week_of: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          week_of: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          week_of?: string
        }
        Relationships: []
      }
      recap_questions: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          idx: number
          source: string
          text: string
          week_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          idx: number
          source?: string
          text: string
          week_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          idx?: number
          source?: string
          text?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recap_questions_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "recap_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      recap_submitted_questions: {
        Row: {
          author_id: string
          created_at: string
          id: string
          text: string
          used: boolean
          votes: number
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          text: string
          used?: boolean
          votes?: number
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          text?: string
          used?: boolean
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "recap_submitted_questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recap_question_votes: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recap_question_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "recap_submitted_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_question_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recap_answers: {
        Row: {
          author_id: string
          created_at: string
          duration_seconds: number
          expires_at: string | null
          id: string
          media_id: string | null
          question_index: number
          visible_to_tier: Database["public"]["Enums"]["tier"]
          week_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          duration_seconds?: number
          expires_at?: string | null
          id?: string
          media_id?: string | null
          question_index: number
          visible_to_tier?: Database["public"]["Enums"]["tier"]
          week_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          duration_seconds?: number
          expires_at?: string | null
          id?: string
          media_id?: string | null
          question_index?: number
          visible_to_tier?: Database["public"]["Enums"]["tier"]
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recap_answers_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "recap_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_answers_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_answers_author_id_fkey"
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
          avatar_filter: string | null
          avatar_media_id: string | null
          avatar_original_media_id: string | null
          display_name: string | null
          profile_song: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_filter?: string | null
          avatar_media_id?: string | null
          avatar_original_media_id?: string | null
          display_name?: string | null
          profile_song?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_filter?: string | null
          avatar_media_id?: string | null
          avatar_original_media_id?: string | null
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
            foreignKeyName: "user_identity_avatar_original_media_id_fkey"
            columns: ["avatar_original_media_id"]
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
          assistant_enabled: boolean
          always_view_original: boolean
          can_invite: boolean
          delight_opt_ins: string[]
          demo_invite_sent_at: string | null
          home_city: string | null
          home_layout: Json | null
          locale: string | null
          meet_scope: string
          notif_prefs: Json
          onboarding_complete: boolean
          onboarding_step: string | null
          onboarding_draft: Json | null
          profile_intro_seen: boolean
          profile_presentation: Json | null
          profile_custom_css: string | null
          profile_custom_html: Json | null
          profile_custom_code_status: string | null
          profile_custom_code_sanitized_at: string | null
          profile_color: string | null
          social_battery: number | null
          connection_style: Json | null
          membership_interests: string[]
          help_interests: string[]
          page_authoring: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          discoverable?: boolean
          assistant_enabled?: boolean
          always_view_original?: boolean
          can_invite?: boolean
          delight_opt_ins?: string[]
          demo_invite_sent_at?: string | null
          home_city?: string | null
          home_layout?: Json | null
          locale?: string | null
          meet_scope?: string
          notif_prefs?: Json
          onboarding_complete?: boolean
          onboarding_step?: string | null
          onboarding_draft?: Json | null
          profile_intro_seen?: boolean
          profile_presentation?: Json | null
          profile_custom_css?: string | null
          profile_custom_html?: Json | null
          profile_custom_code_status?: string | null
          profile_custom_code_sanitized_at?: string | null
          profile_color?: string | null
          social_battery?: number | null
          connection_style?: Json | null
          membership_interests?: string[]
          help_interests?: string[]
          page_authoring?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          discoverable?: boolean
          assistant_enabled?: boolean
          always_view_original?: boolean
          can_invite?: boolean
          delight_opt_ins?: string[]
          demo_invite_sent_at?: string | null
          home_city?: string | null
          home_layout?: Json | null
          locale?: string | null
          meet_scope?: string
          notif_prefs?: Json
          onboarding_complete?: boolean
          onboarding_step?: string | null
          onboarding_draft?: Json | null
          profile_intro_seen?: boolean
          profile_presentation?: Json | null
          profile_custom_css?: string | null
          profile_custom_html?: Json | null
          profile_custom_code_status?: string | null
          profile_custom_code_sanitized_at?: string | null
          profile_color?: string | null
          social_battery?: number | null
          connection_style?: Json | null
          membership_interests?: string[]
          help_interests?: string[]
          page_authoring?: string | null
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
      week_summaries: {
        Row: {
          id: string
          author_id: string
          week_start: string
          days_json: Json
          built_at: string
        }
        Insert: {
          id?: string
          author_id: string
          week_start: string
          days_json?: Json
          built_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          week_start?: string
          days_json?: Json
          built_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_summaries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_activities: {
        Row: {
          active: boolean
          closes_in: string | null
          cover: Json | null
          created_at: string
          emoji: string | null
          ends_at: string | null
          id: string
          post_mode: string
          prompt: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          closes_in?: string | null
          cover?: Json | null
          created_at?: string
          emoji?: string | null
          ends_at?: string | null
          id?: string
          post_mode?: string
          prompt?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          closes_in?: string | null
          cover?: Json | null
          created_at?: string
          emoji?: string | null
          ends_at?: string | null
          id?: string
          post_mode?: string
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
      merge_pending_people_for_user: {
        Args: {
          p_user: string
          p_phone: string
        }
        Returns: number
      }
    }
    Enums: {
      attr_layer: "essential" | "profile" | "connection"
      connection_status: "pending" | "accepted"
      coop_plan: "free" | "coop"
      delight_scope: "global" | "opt-in" | "gift"
      event_invite_status: "going" | "cant" | "invited"
      friend_note_kind: "text" | "date" | "check_in"
      made_via: "link" | "qr" | "add" | "suggestion"
      media_kind: "photo" | "video" | "audio"
      met_context: "event" | "place" | "mutual" | "qr" | "link"
      payment_kind: "coop_dues" | "billy_plus"
      quiz_question_type: "single" | "multi"
      quiz_status: "live" | "draft" | "archived"
      reaction_kind: "circleVideo" | "text" | "sticker"
      storage_plan: "rolling30" | "unlimited"
      story_type: "photo" | "video" | "audio"
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
      friend_note_kind: ["text", "date", "check_in"],
      made_via: ["link", "qr", "add", "suggestion"],
      media_kind: ["photo", "video", "audio"],
      met_context: ["event", "place", "mutual", "qr", "link"],
      payment_kind: ["coop_dues", "billy_plus"],
      quiz_question_type: ["single", "multi"],
      quiz_status: ["live", "draft", "archived"],
      reaction_kind: ["circleVideo", "text", "sticker"],
      storage_plan: ["rolling30", "unlimited"],
      story_type: ["photo", "video", "audio"],
      summary_cadence: ["weekly", "daily"],
      tier: ["none", "acquaintance", "friend", "close"],
      touch_grass_when: ["now", "tonight", "weekend"],
    },
  },
} as const
