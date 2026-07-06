import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Map Base44 entity names to relational Postgres tables
const TABLE_MAP = {
  Transaction: "transactions",
  SavingsGoal: "savings_goals",
  Budget: "budgets",
  TermsAcceptance: "terms_acceptances",
};

/**
 * Parses a string sort parameter (e.g. "-date", "created_date") 
 * into a structured object for Supabase's query builder.
 */
function parseSort(sortStr) {
  if (!sortStr) return null;
  const desc = sortStr.startsWith("-");
  const column = desc ? sortStr.slice(1) : sortStr;
  return { column, ascending: !desc };
}

/**
 * Dynamically constructs a Base44-compatible entity manager around 
 * Supabase tables to keep your frontend views 100% untouched.
 */
function buildEntityAdapter(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) return {};

  return {
    async list(sort, limit) {
      let query = supabase.from(table).select("*");
      const orderOpts = parseSort(sort);
      
      if (orderOpts) query = query.order(orderOpts.column, { ascending: orderOpts.ascending });
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },

    async filter(filterObj, sort, limit) {
      let query = supabase.from(table).select("*");

      if (filterObj && typeof filterObj === "object") {
        for (const [key, value] of Object.entries(filterObj)) {
          if (value && typeof value === "object") {
            if ("$gte" in value) query = query.gte(key, value.$gte);
            if ("$lte" in value) query = query.lte(key, value.$lte);
          } else {
            query = query.eq(key, value);
          }
        }
      }

      const orderOpts = parseSort(sort);
      if (orderOpts) query = query.order(orderOpts.column, { ascending: orderOpts.ascending });
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
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

    schema() {
      return null;
    },
  };
}

// Emulated Base44 client object mapping identically to original API signatures
export const base44 = {
  entities: Object.fromEntries(Object.keys(TABLE_MAP).map((name) => [name, buildEntityAdapter(name)])),
  auth: {
    async me() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error("Not authenticated");
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
        role: user.user_metadata?.role || "user",
      };
    },

    async isAuthenticated() {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
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

    async resendOtp(email) {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw new Error(error.message);
    },

    setToken() {},

    async resetPasswordRequest(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
    },

    async resetPassword({ newPassword }) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },

    async loginWithProvider(provider, fromUrl) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: fromUrl || window.location.origin },
      });
      if (error) throw new Error(error.message);
    },

    async logout(redirectUrl) {
      await supabase.auth.signOut();
      if (redirectUrl) window.location.href = redirectUrl;
      else window.location.reload();
    },

    redirectToLogin(nextUrl) {
      const base = "/login";
      window.location.href = nextUrl ? `${base}?next=${encodeURIComponent(nextUrl)}` : base;
    },

    async updateMe(data) {
      const updates = {};
      if (data.full_name !== undefined) updates.data = { full_name: data.full_name };
      if (data.email) updates.email = data.email;
      
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw new Error(error.message);
    },
  },
};
