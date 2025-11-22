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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          entity_code: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          org_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          entity_code: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          org_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          entity_code?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          barcode: string
          capacity: number | null
          capacity_enabled: boolean
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          type: string
          updated_at: string
          updated_by: string | null
          warehouse_id: string
          zone: string | null
          zone_enabled: boolean
        }
        Insert: {
          barcode: string
          capacity?: number | null
          capacity_enabled?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          type: string
          updated_at?: string
          updated_by?: string | null
          warehouse_id: string
          zone?: string | null
          zone_enabled?: boolean
        }
        Update: {
          barcode?: string
          capacity?: number | null
          capacity_enabled?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: string
          zone?: string | null
          zone_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_line_assignments: {
        Row: {
          created_at: string
          id: string
          line_id: string
          machine_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_id: string
          machine_id: string
        }
        Update: {
          created_at?: string
          id?: string
          line_id?: string
          machine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_line_assignments_line_fk"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_line_assignments_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          capacity_per_hour: number | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          capacity_per_hour?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          capacity_per_hour?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string
          date_format: string | null
          default_currency: string | null
          default_language: string | null
          fiscal_year_start: string | null
          id: string
          logo_url: string | null
          nip_vat: string | null
          number_format: string | null
          postal_code: string | null
          timezone: string | null
          unit_system: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string
          date_format?: string | null
          default_currency?: string | null
          default_language?: string | null
          fiscal_year_start?: string | null
          id?: string
          logo_url?: string | null
          nip_vat?: string | null
          number_format?: string | null
          postal_code?: string | null
          timezone?: string | null
          unit_system?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          date_format?: string | null
          default_currency?: string | null
          default_language?: string | null
          fiscal_year_start?: string | null
          id?: string
          logo_url?: string | null
          nip_vat?: string | null
          number_format?: string | null
          postal_code?: string | null
          timezone?: string | null
          unit_system?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      production_lines: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          default_output_location_id: string | null
          id: string
          name: string
          org_id: string
          updated_at: string
          updated_by: string | null
          warehouse_id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          default_output_location_id?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
          warehouse_id: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          default_output_location_id?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_lines_default_output_location_id_fkey"
            columns: ["default_output_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_lines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_lines_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: string
          sent_at: string
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          org_id: string
          role: string
          sent_at?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          dashboard_config: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          dashboard_config?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          dashboard_config?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          location: string | null
          logged_out_at: string | null
          login_time: string
          token_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          location?: string | null
          logged_out_at?: string | null
          login_time?: string
          token_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          location?: string | null
          logged_out_at?: string | null
          login_time?: string
          token_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          first_name: string | null
          id: string
          last_login_at: string | null
          last_name: string | null
          org_id: string
          role: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          first_name?: string | null
          id: string
          last_login_at?: string | null
          last_name?: string | null
          org_id: string
          role?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          org_id?: string
          role?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          default_receiving_location_id: string | null
          default_shipping_location_id: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          transit_location_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          default_receiving_location_id?: string | null
          default_shipping_location_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          transit_location_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          default_receiving_location_id?: string | null
          default_shipping_location_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          transit_location_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_audit_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      batch_create_purchase_orders: {
        Args: { p_created_by: string; p_lines: Json; p_warehouse_id: number }
        Returns: {
          id: number
          line_count: number
          number: string
          supplier_id: number
          supplier_name: string
        }[]
      }
      batch_create_work_orders: {
        Args: { p_work_orders: Json }
        Returns: {
          id: number
          number: string
          product_id: number
        }[]
      }
      create_composite_product: { Args: { p: Json }; Returns: Json }
      get_default_dashboard_config: { Args: never; Returns: Json }
      get_entity_audit_trail: {
        Args: { p_entity_id: number; p_entity_name: string }
        Returns: {
          after_data: Json
          before_data: Json
          command: string
          event_timestamp: string
          source: string
          statement: string
          user_email: string
        }[]
      }
      get_pgaudit_stats: {
        Args: never
        Returns: {
          avg_logs_per_day: number
          logs_last_24h: number
          logs_last_7d: number
          newest_log: string
          oldest_log: string
          total_logs: number
        }[]
      }
      get_user_org_id: { Args: never; Returns: number }
      merge_dashboard_config: { Args: { user_config: Json }; Returns: Json }
      select_bom_for_wo: {
        Args: { p_product_id: number; p_scheduled_date?: string }
        Returns: {
          bom_id: number
          bom_version: number
          effective_from: string
          effective_to: string
        }[]
      }
    }
    Enums: {
      asn_status: "Draft" | "Sent" | "Received" | "Cancelled"
      bom_status: "Draft" | "Active" | "Phased Out" | "Inactive"
      grn_status: "Draft" | "Completed" | "Cancelled"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      location_type:
        | "Storage"
        | "Production"
        | "Shipping"
        | "Receiving"
        | "Quarantine"
        | "Transit"
      lp_status:
        | "Available"
        | "Reserved"
        | "In Transit"
        | "Consumed"
        | "Quarantine"
        | "Blocked"
      move_type:
        | "Receipt"
        | "Issue"
        | "Transfer"
        | "Adjustment"
        | "Production"
        | "Consumption"
      po_status:
        | "Draft"
        | "Sent"
        | "Confirmed"
        | "Partially Received"
        | "Received"
        | "Cancelled"
      product_group: "MEAT" | "DRYGOODS" | "COMPOSITE"
      product_type:
        | "Raw Material"
        | "Semi-Finished"
        | "Finished Good"
        | "Packaging"
        | "By-Product"
        | "RM_MEAT"
        | "DG_WEB"
        | "DG_LABEL"
        | "DG_BOX"
        | "DG_ING"
        | "DG_SAUCE"
        | "DG_OTHER"
        | "PR"
        | "FG"
      to_status: "Draft" | "Released" | "In Transit" | "Completed" | "Cancelled"
      wo_status:
        | "Draft"
        | "Released"
        | "In Progress"
        | "Completed"
        | "Cancelled"
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
      asn_status: ["Draft", "Sent", "Received", "Cancelled"],
      bom_status: ["Draft", "Active", "Phased Out", "Inactive"],
      grn_status: ["Draft", "Completed", "Cancelled"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      location_type: [
        "Storage",
        "Production",
        "Shipping",
        "Receiving",
        "Quarantine",
        "Transit",
      ],
      lp_status: [
        "Available",
        "Reserved",
        "In Transit",
        "Consumed",
        "Quarantine",
        "Blocked",
      ],
      move_type: [
        "Receipt",
        "Issue",
        "Transfer",
        "Adjustment",
        "Production",
        "Consumption",
      ],
      po_status: [
        "Draft",
        "Sent",
        "Confirmed",
        "Partially Received",
        "Received",
        "Cancelled",
      ],
      product_group: ["MEAT", "DRYGOODS", "COMPOSITE"],
      product_type: [
        "Raw Material",
        "Semi-Finished",
        "Finished Good",
        "Packaging",
        "By-Product",
        "RM_MEAT",
        "DG_WEB",
        "DG_LABEL",
        "DG_BOX",
        "DG_ING",
        "DG_SAUCE",
        "DG_OTHER",
        "PR",
        "FG",
      ],
      to_status: ["Draft", "Released", "In Transit", "Completed", "Cancelled"],
      wo_status: ["Draft", "Released", "In Progress", "Completed", "Cancelled"],
    },
  },
} as const
