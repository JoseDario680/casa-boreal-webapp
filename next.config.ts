import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kuykzafybylscordnbyh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eWt6YWZ5Ynlsc2NvcmRuYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTUwOTQsImV4cCI6MjA1OTkzMTA5NH0.sb_publishable_m9iWKAVDw62Dxv-CSyJHmQ_WWu6WMKW",
  },
  // Configuración de Turbopack
  turbopack: {
    // Configuración de Turbopack si es necesaria
  },
};

export default nextConfig;
