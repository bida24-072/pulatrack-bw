# PulaTrack — Migration Architecture Guide

This blueprint lets you pivot PulaTrack away from Base44 to a self-managed backend running entirely on Supabase or generic Postgres hosts (Neon, Railway) without modifying a single file under `src/pages/` or `src/components/`.

## 🚀 Step-by-Step Hot Swap

### 1. Database Setup
1. Open the **SQL Editor** in your Supabase dashboard or connect directly via `psql`.
2. Copy, paste, and run the complete database script found inside `supabase/schema.sql`.
3. Verify that your four operational tables (`transactions`, `savings_goals`, `budgets`, `terms_acceptances`) are created with proper Row Level Security (RLS).

### 2. Configure Local Settings
Create a `.env.local` file at the project root and fill out your standalone database API endpoints:
```ini
VITE_SUPABASE_URL=[https://your-project-ref.supabase.co](https://your-project-ref.supabase.co)
VITE_SUPABASE_ANON_KEY=your-public-anon-key-here
