import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kuykzafybylscordnbyh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eWt6YWZ5Ynlsc2NvcmRuYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI4ODUsImV4cCI6MjA4OTg4ODg4NX0.TDf9k2uZ0bS73o_XNDMBRPvxAjy7Sf3DjWZFxw6C1FQ",
  },
  // Configuración de Turbopack
  turbopack: {
    // Configuración de Turbopack si es necesaria
  },
};

export default nextConfig;
