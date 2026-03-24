export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'CLIENTE';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLIST';
export type ClassRecurrence = 'WEEKLY' | 'NONE';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          classes_per_month: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents: number;
          classes_per_month?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price_cents?: number;
          classes_per_month?: number | null;
          is_active?: boolean;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          credits_remaining: number | null;
          start_date: string;
          end_date: string;
          status: MembershipStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          credits_remaining?: number | null;
          start_date: string;
          end_date: string;
          status?: MembershipStatus;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          plan_id?: string;
          credits_remaining?: number | null;
          start_date?: string;
          end_date?: string;
          status?: MembershipStatus;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          instructor_id: string | null;
          level: string;
          start_time: string;
          end_time: string;
          capacity: number;
          recurrence: ClassRecurrence;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          instructor_id?: string | null;
          level: string;
          start_time: string;
          end_time: string;
          capacity: number;
          recurrence?: ClassRecurrence;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          instructor_id?: string | null;
          level?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          recurrence?: ClassRecurrence;
          is_active?: boolean;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          status: BookingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          status?: BookingStatus;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          class_id?: string;
          status?: BookingStatus;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      membership_status: MembershipStatus;
      booking_status: BookingStatus;
      class_recurrence: ClassRecurrence;
    };
  };
}
