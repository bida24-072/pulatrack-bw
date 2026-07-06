import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const TABLE_MAP = {
  Transaction: "transactions",
  SavingsGoal: "savings_goals",
  Budget: "budgets",
  TermsAcceptance: "terms_acceptances",
};

function parseSort(sort) {
  if (!sort) return null;
  const desc = sort.startsWith("-");
  return { column: desc? sort.slice(1) : sort, ascending:!desc };
}

function buildEntity(name) {
  const table = TABLE_MAP[name];
  return {
    async list(sort, limit) {
      let q = supabase.from(table).select("*");
      const o = parseSort(sort);
      if (o) q = q.order(o.column, { ascending: o.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}

export const base44 = {
  entities: Object.fromEntries(Object.keys(TABLE_MAP).map((n) => [n, buildEntity(n)])),
  auth: {
    async me() {
      const { data: { user } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || "", role: "user" };
    },
    async isAuthenticated() {
      const { data: { session } = await supabase.auth.getSession();
      return!!session;
    },
    async loginViaEmailPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async register({ email, password }) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
    },
    async verifyOtp({ email, otpCode }) {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "signup" });
      if (error) throw new Error(error.message);
      return { access_token: data?.session?.access_token || "" };
    },
    async resendOtp(email) { await supabase.auth.resend({ type: "signup", email }); },
    setToken() {},
    async resetPasswordRequest(email) { await supabase.auth.resetPasswordForEmail(email); },
    async resetPassword({ newPassword }) { await supabase.auth.updateUser({ password: newPassword }); },
    async loginWithProvider(provider) { await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } }); },
    async logout() { await supabase.auth.signOut(); window.location.reload(); },
    redirectToLogin() { window.location.href = "/login"; },
    async updateMe(data) { await supabase.auth.updateUser({ data }); },
  },
};
