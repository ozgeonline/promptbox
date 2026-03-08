import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Profile } from '@/types';
import { useAuthContext } from '@/context';

export const useProfile = () => {
  const { session } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Rows not found" which is fine initially
        throw error;
      }
      setProfile(data);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching profile:', err);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (username: string, birthdate: string) => {
    if (!session?.user?.id) return { success: false, error: 'User not logged in' };

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: username.trim() || null,
          birthdate: birthdate || null,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        // Handle uniqueness error
        if (error.code === '23505') {
          throw new Error('Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.');
        }
        throw error;
      }

      setProfile(data);
      return { success: true, data };
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating profile:', err);
      }
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const isOldEnough = useCallback(() => {
    if (!profile?.birthdate) return false;

    const birthDate = new Date(profile.birthdate);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 18;
  }, [profile?.birthdate]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    isOldEnough,
    refreshProfile: fetchProfile
  };
};
