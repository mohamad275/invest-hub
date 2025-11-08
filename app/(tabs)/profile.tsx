import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { StartupProfile, InvestorProfile } from '@/types';
import { LogOut, CreditCard as Edit, User, Building2, TrendingUp, Eye, MessageCircle, Heart, Image as ImageIcon } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const { user, profile, signOut } = useAuth();
  const [roleProfile, setRoleProfile] = useState<StartupProfile | InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, messages: 0, favorites: 0 });

  useEffect(() => {
    fetchRoleProfile();
  }, [profile]);

  useEffect(() => {
    if (profile?.role === 'startup' && roleProfile) {
      fetchStartupStats();
    }
  }, [profile, roleProfile]);

  const fetchRoleProfile = async () => {
    if (!profile) return;

    try {
      if (profile.role === 'startup') {
        const { data } = await supabase
          .from('startup_profiles')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (data) setRoleProfile(data as StartupProfile);
      } else {
        const { data } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (data) setRoleProfile(data as InvestorProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStartupStats = async () => {
    if (!roleProfile) return;

    try {
      const { count: viewCount } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', (roleProfile as StartupProfile).id);

      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user?.id);

      const { count: favoriteCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', (roleProfile as StartupProfile).id);

      setStats({
        views: viewCount || 0,
        messages: messageCount || 0,
        favorites: favoriteCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/settings/edit-profile')}>
            <Edit size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.role === 'startup' ? (
              <Building2 size={32} color={colors.primary} />
            ) : (
              <TrendingUp size={32} color={colors.primary} />
            )}
          </View>

          <Text style={styles.name}>
            {roleProfile
              ? profile?.role === 'startup'
                ? (roleProfile as StartupProfile).company_name
                : (roleProfile as InvestorProfile).name
              : 'User'}
          </Text>

          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profile?.role === 'startup' ? 'Startup' : 'Investor'}
            </Text>
          </View>
        </View>

        {profile?.role === 'startup' && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Eye size={24} color={colors.primary} />
                <Text style={styles.statValue}>{stats.views}</Text>
                <Text style={styles.statLabel}>Profile Views</Text>
              </View>
              <View style={styles.statCard}>
                <MessageCircle size={24} color={colors.primary} />
                <Text style={styles.statValue}>{stats.messages}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statCard}>
                <Heart size={24} color={colors.primary} />
                <Text style={styles.statValue}>{stats.favorites}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>
          </View>
        )}

        {roleProfile && profile?.role === 'startup' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Info</Text>
            <View style={styles.infoCard}>
              <InfoRow
                label="Sector"
                value={(roleProfile as StartupProfile).sector}
                colors={colors}
              />
              <InfoRow
                label="Stage"
                value={(roleProfile as StartupProfile).stage}
                colors={colors}
              />
              <InfoRow
                label="Location"
                value={(roleProfile as StartupProfile).location}
                colors={colors}
              />
              {(roleProfile as StartupProfile).funding_goal > 0 && (
                <InfoRow
                  label="Funding Goal"
                  value={`$${((roleProfile as StartupProfile).funding_goal / 1000).toFixed(0)}K`}
                  colors={colors}
                />
              )}
            </View>
          </View>
        )}

        {roleProfile && profile?.role === 'investor' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investor Info</Text>
            <View style={styles.infoCard}>
              <InfoRow
                label="Type"
                value={(roleProfile as InvestorProfile).investor_type}
                colors={colors}
              />
              <InfoRow
                label="Location"
                value={(roleProfile as InvestorProfile).location}
                colors={colors}
              />
              {(roleProfile as InvestorProfile).company && (
                <InfoRow
                  label="Company"
                  value={(roleProfile as InvestorProfile).company!}
                  colors={colors}
                />
              )}
            </View>
          </View>
        )}

        {profile?.role === 'startup' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => router.push('/settings/manage-media')}>
              <ImageIcon size={20} color={colors.primary} />
              <Text style={styles.mediaButtonText}>Manage Media</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
      <Text style={{ fontSize: 14, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{value}</Text>
    </View>
  );
}

function createStyles(colors: typeof Colors.light) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    iconButton: {
      padding: 8,
    },
    profileCard: {
      backgroundColor: colors.card,
      marginHorizontal: 24,
      marginBottom: 24,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.primary}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    statsContainer: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: `${colors.error}15`,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error,
    },
    signOutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
    mediaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: `${colors.primary}15`,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    mediaButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
