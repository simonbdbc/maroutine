// ─────────────────────────────────────────────────────────────────────────────
// Types générés depuis le schéma Supabase.
//
// Pour régénérer depuis ton projet Supabase :
//   npx supabase gen types typescript \
//     --project-id <ton-project-id> \
//     > src/shared/db/supabaseTypes.ts
//
// En attendant la génération, ce fichier définit les types manuellement
// pour correspondre exactement au schéma de EPIC3-supabase.md.
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MomentKind = "morning" | "noon" | "afternoon" | "evening";
export type DailyCheckTargetType = "moment" | "activity" | "task";
export type BalanceHistorySource =
  | "daily_validation"
  | "manual_adjustment"
  | "reward_redemption";

// ─── Tables ───────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          primary_color: string;
          secondary_color: string;
          sticker_key: string;
          balance: number;
          sort_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          primary_color?: string;
          secondary_color?: string;
          sticker_key?: string;
          balance?: number;
          sort_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          primary_color?: string;
          secondary_color?: string;
          sticker_key?: string;
          balance?: number;
          sort_index?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_catalog_states: {
        Row: {
          user_id: string;
          seeded_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          seeded_at?: string;
          created_at?: string;
        };
        Update: {
          seeded_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      moments: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          kind: MomentKind;
          label: string | null;
          default_stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          kind: MomentKind;
          label?: string | null;
          default_stars?: number;
          sort_index?: number;
        };
        Update: {
          name?: string;
          kind?: MomentKind;
          label?: string | null;
          default_stars?: number;
          sort_index?: number;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          label: string | null;
          icon: string | null;
          default_stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          label?: string | null;
          icon?: string | null;
          default_stars?: number;
          sort_index?: number;
        };
        Update: {
          name?: string;
          label?: string | null;
          icon?: string | null;
          default_stars?: number;
          sort_index?: number;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          label: string | null;
          default_stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          label?: string | null;
          default_stars?: number;
          sort_index?: number;
        };
        Update: {
          name?: string;
          label?: string | null;
          default_stars?: number;
          sort_index?: number;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          sort_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          sort_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          sort_index?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_templates: {
        Row: {
          template_key: string;
          name: string;
          primary_color: string;
          secondary_color: string;
          sticker_key: string;
          sort_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          template_key: string;
          name: string;
          primary_color?: string;
          secondary_color?: string;
          sticker_key?: string;
          sort_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          primary_color?: string;
          secondary_color?: string;
          sticker_key?: string;
          sort_index?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_template_moments: {
        Row: {
          id: string;
          template_key: string;
          moment_name: string;
          moment_kind: MomentKind;
          stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          template_key: string;
          moment_name: string;
          moment_kind: MomentKind;
          stars?: number;
          sort_index?: number;
        };
        Update: { stars?: number; sort_index?: number };
        Relationships: [];
      };
      profile_template_activities: {
        Row: {
          id: string;
          template_moment_id: string;
          activity_name: string;
          stars: number;
          sticker_key: string;
          sort_index: number;
        };
        Insert: {
          id?: string;
          template_moment_id: string;
          activity_name: string;
          stars?: number;
          sticker_key?: string;
          sort_index?: number;
        };
        Update: { stars?: number; sticker_key?: string; sort_index?: number };
        Relationships: [];
      };
      profile_template_tasks: {
        Row: {
          id: string;
          template_activity_id: string;
          task_name: string;
          stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          template_activity_id: string;
          task_name: string;
          stars?: number;
          sort_index?: number;
        };
        Update: { stars?: number; sort_index?: number };
        Relationships: [];
      };
      profile_template_rewards: {
        Row: {
          id: string;
          template_key: string;
          reward_name: string;
          duration_minutes: number;
          cost_stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          template_key: string;
          reward_name: string;
          duration_minutes: number;
          cost_stars: number;
          sort_index?: number;
        };
        Update: {
          duration_minutes?: number;
          cost_stars?: number;
          sort_index?: number;
        };
        Relationships: [];
      };
      profile_moments: {
        Row: {
          id: string;
          profile_id: string;
          moment_id: string;
          stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          profile_id: string;
          moment_id: string;
          stars?: number;
          sort_index?: number;
        };
        Update: { stars?: number; sort_index?: number };
        Relationships: [];
      };
      profile_rewards: {
        Row: {
          id: string;
          profile_id: string;
          reward_id: string;
          duration_minutes: number;
          cost_stars: number;
          sort_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          reward_id: string;
          duration_minutes: number;
          cost_stars: number;
          sort_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reward_id?: string;
          duration_minutes?: number;
          cost_stars?: number;
          sort_index?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_moment_activities: {
        Row: {
          id: string;
          profile_moment_id: string;
          activity_id: string;
          stars: number;
          sticker_key: string;
          sort_index: number;
        };
        Insert: {
          id?: string;
          profile_moment_id: string;
          activity_id: string;
          stars?: number;
          sticker_key?: string;
          sort_index?: number;
        };
        Update: { stars?: number; sticker_key?: string; sort_index?: number };
        Relationships: [];
      };
      profile_moment_activity_tasks: {
        Row: {
          id: string;
          profile_moment_activity_id: string;
          task_id: string;
          stars: number;
          sort_index: number;
        };
        Insert: {
          id?: string;
          profile_moment_activity_id: string;
          task_id: string;
          stars?: number;
          sort_index?: number;
        };
        Update: { stars?: number; sort_index?: number };
        Relationships: [];
      };
      daily_checks: {
        Row: {
          id: string;
          profile_id: string;
          check_date: string;
          target_type: DailyCheckTargetType;
          profile_moment_id: string | null;
          profile_moment_activity_id: string | null;
          profile_moment_activity_task_id: string | null;
          checked: boolean;
          sticker_key: string | null;
          stars_earned: number;
          checked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          check_date?: string;
          target_type: DailyCheckTargetType;
          profile_moment_id?: string | null;
          profile_moment_activity_id?: string | null;
          profile_moment_activity_task_id?: string | null;
          checked?: boolean;
          sticker_key?: string | null;
          stars_earned?: number;
          checked_at?: string | null;
        };
        Update: {
          checked?: boolean;
          sticker_key?: string | null;
          stars_earned?: number;
          checked_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_validations: {
        Row: {
          id: string;
          profile_id: string;
          check_date: string;
          earned_stars: number;
          new_balance: number;
          validated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          check_date?: string;
          earned_stars?: number;
          new_balance: number;
          validated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          check_date?: string;
          earned_stars?: number;
          new_balance?: number;
          validated_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      balance_history: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          delta_stars: number;
          balance_before: number;
          balance_after: number;
          source: BalanceHistorySource;
          description: string;
          occurred_at: string;
          metadata: Json;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          delta_stars: number;
          balance_before: number;
          balance_after: number;
          source: BalanceHistorySource;
          description: string;
          occurred_at?: string;
          metadata?: Json;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          description?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      initialize_my_catalog: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_profile_from_template: {
        Args: {
          p_template_key?: string | null;
        };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          primary_color: string;
          secondary_color: string;
          sticker_key: string;
          balance: number;
          sort_index: number;
          created_at: string;
          updated_at: string;
        }[];
      };
      toggle_task_check: {
        Args: {
          p_profile_id: string;
          p_profile_moment_activity_task_id: string;
          p_check_date?: string | null;
        };
        Returns: {
          task_checked: boolean;
          activity_checked: boolean;
          moment_checked: boolean;
        }[];
      };
      toggle_activity_check: {
        Args: {
          p_profile_id: string;
          p_profile_moment_activity_id: string;
          p_check_date?: string | null;
        };
        Returns: {
          activity_checked: boolean;
          moment_checked: boolean;
        }[];
      };
      validate_day: {
        Args: {
          p_profile_id: string;
          p_check_date?: string | null;
        };
        Returns: {
          earned_stars: number;
          new_balance: number;
        }[];
      };
      redeem_profile_reward: {
        Args: {
          p_profile_reward_id: string;
        };
        Returns: {
          profile_id: string;
          spent_stars: number;
          new_balance: number;
        }[];
      };
      set_profile_balance: {
        Args: {
          p_profile_id: string;
          p_amount: number;
          p_description?: string | null;
        };
        Returns: {
          previous_balance: number;
          new_balance: number;
          delta_stars: number;
        }[];
      };
    };
    Enums: {
      moment_kind: MomentKind;
      daily_check_target_type: DailyCheckTargetType;
    };
  };
}

// ─── Helpers de type ──────────────────────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type RpcArgs<T extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][T]["Args"];

export type RpcReturns<T extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][T]["Returns"];

// Raccourcis
export type ProfileRow = Tables<"profiles">;
export type UserCatalogStateRow = Tables<"user_catalog_states">;
export type MomentRow = Tables<"moments">;
export type ActivityRow = Tables<"activities">;
export type TaskRow = Tables<"tasks">;
export type RewardRow = Tables<"rewards">;
export type ProfileTemplateRow = Tables<"profile_templates">;
export type ProfileTemplateMomentRow = Tables<"profile_template_moments">;
export type ProfileTemplateActivityRow = Tables<"profile_template_activities">;
export type ProfileTemplateTaskRow = Tables<"profile_template_tasks">;
export type ProfileTemplateRewardRow = Tables<"profile_template_rewards">;
export type ProfileMomentRow = Tables<"profile_moments">;
export type ProfileRewardRow = Tables<"profile_rewards">;
export type ProfileMomentActivityRow = Tables<"profile_moment_activities">;
export type ProfileMomentActivityTaskRow = Tables<"profile_moment_activity_tasks">;
export type DailyCheckRow = Tables<"daily_checks">;
export type DailyValidationRow = Tables<"daily_validations">;
export type BalanceHistoryRow = Tables<"balance_history">;

export type ToggleTaskCheckArgs = RpcArgs<"toggle_task_check">;
export type ToggleTaskCheckReturn = RpcReturns<"toggle_task_check">[number];
export type ToggleActivityCheckArgs = RpcArgs<"toggle_activity_check">;
export type ToggleActivityCheckReturn = RpcReturns<"toggle_activity_check">[number];
export type ValidateDayArgs = RpcArgs<"validate_day">;
export type ValidateDayReturn = RpcReturns<"validate_day">[number];
export type RedeemProfileRewardArgs = RpcArgs<"redeem_profile_reward">;
export type RedeemProfileRewardReturn = RpcReturns<"redeem_profile_reward">[number];
export type SetProfileBalanceArgs = RpcArgs<"set_profile_balance">;
export type SetProfileBalanceReturn = RpcReturns<"set_profile_balance">[number];
export type CreateProfileFromTemplateArgs = RpcArgs<"create_profile_from_template">;
export type CreateProfileFromTemplateReturn = RpcReturns<"create_profile_from_template">[number];
