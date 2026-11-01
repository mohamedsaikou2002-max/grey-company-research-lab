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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          citations: Json
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          session_id: string
        }
        Insert: {
          citations?: Json
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          session_id: string
        }
        Update: {
          citations?: Json
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          scope: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          scope: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          scope?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_profiles: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      individual_profiles: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      neural_runs: {
        Row: {
          created_at: string
          id: string
          input: Json
          mode: string
          seed: number
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          input: Json
          mode: string
          seed: number
          summary: Json
        }
        Update: {
          created_at?: string
          id?: string
          input?: Json
          mode?: string
          seed?: number
          summary?: Json
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          config: Json
          created_at: string
          group_profile_id: string | null
          id: string
          individual_profile_id: string | null
          name: string
        }
        Insert: {
          config: Json
          created_at?: string
          group_profile_id?: string | null
          id?: string
          individual_profile_id?: string | null
          name: string
        }
        Update: {
          config?: Json
          created_at?: string
          group_profile_id?: string | null
          id?: string
          individual_profile_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_individual_profile_id_fkey"
            columns: ["individual_profile_id"]
            isOneToOne: false
            referencedRelation: "individual_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_runs: {
        Row: {
          agents: Json | null
          created_at: string
          engine: string
          error: string | null
          frames: Json | null
          id: string
          input: Json
          input_hash: string
          model_version: string
          scenario_id: string | null
          seed: number
          status: string
          summary: Json | null
        }
        Insert: {
          agents?: Json | null
          created_at?: string
          engine: string
          error?: string | null
          frames?: Json | null
          id?: string
          input: Json
          input_hash: string
          model_version: string
          scenario_id?: string | null
          seed: number
          status?: string
          summary?: Json | null
        }
        Update: {
          agents?: Json | null
          created_at?: string
          engine?: string
          error?: string | null
          frames?: Json | null
          id?: string
          input?: Json
          input_hash?: string
          model_version?: string
          scenario_id?: string | null
          seed?: number
          status?: string
          summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      source_documents: {
        Row: {
          author: string | null
          category: string | null
          created_at: string
          evidence_tier: string | null
          id: string
          license: string | null
          origin: string
          summary: string | null
          title: string
          url: string | null
          verification: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string
          evidence_tier?: string | null
          id: string
          license?: string | null
          origin?: string
          summary?: string | null
          title: string
          url?: string | null
          verification?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string
          evidence_tier?: string | null
          id?: string
          license?: string | null
          origin?: string
          summary?: string | null
          title?: string
          url?: string | null
          verification?: string | null
        }
        Relationships: []
      }
      source_excerpts: {
        Row: {
          claim_status: string
          created_at: string
          excerpt: string
          id: string
          independence_cluster: string | null
          page: string | null
          provenance: Json
          source_id: string
        }
        Insert: {
          claim_status?: string
          created_at?: string
          excerpt: string
          id?: string
          independence_cluster?: string | null
          page?: string | null
          provenance?: Json
          source_id: string
        }
        Update: {
          claim_status?: string
          created_at?: string
          excerpt?: string
          id?: string
          independence_cluster?: string | null
          page?: string | null
          provenance?: Json
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_excerpts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
