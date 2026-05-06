import { supabase } from './client';

export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Failed to load profile:', error);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      email_verified: user.email_confirmed_at != null,
      role: profile.role,
      full_name: profile.full_name,
      phone: profile.phone,
      ...profile
    };
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async ({ email, password, full_name, role = 'staff' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  session: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};
