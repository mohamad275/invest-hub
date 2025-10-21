import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { TrendingUp, Rocket, Building2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { StartupProfile } from '@/types';
import { StartupCard } from '@/components/StartupCard';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const { user, profile } = useAuth();
  const [trending, setTrending] = useState<StartupProfile[]>([]);
  const [newStartups, setNewStartups] = useState<StartupProfile[]>([]);
  const [sectors, setSectors] = useState<{ sector: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('startup_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profile?.role === 'startup' && user) {
        query = query.neq('user_id', user.id);
      }

      const { data: startupsData } = await query;

      if (startupsData) {
        setTrending(startupsData.slice(0, 5));
        setNewStartups(startupsData.slice(0, 3));

        const sectorCounts = startupsData.reduce((acc: any, startup) => {
          acc[startup.sector] = (acc[startup.sector] || 0) + 1;
          return acc;
        }, {});

        const sortedSectors = Object.entries(sectorCounts)
          .map(([sector, count]) => ({ sector, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setSectors(sortedSectors);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.logo}>FundLink</Text>
          <Text style={styles.tagline}>Connect. Invest. Grow.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Trending Startups</Text>
          </View>
          {trending.length > 0 ? (
            <View style={styles.cardList}>
              {trending.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No startups yet</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Rocket size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Newly Added</Text>
          </View>
          {newStartups.length > 0 ? (
            <View style={styles.cardList}>
              {newStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No new startups yet</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Top Sectors</Text>
          </View>
          {sectors.length > 0 ? (
            <View style={styles.sectorGrid}>
              {sectors.map(({ sector, count }) => (
                <View key={sector} style={styles.sectorCard}>
                  <Text style={styles.sectorName}>{sector}</Text>
                  <Text style={styles.sectorCount}>{count} startups</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No sectors yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    logo: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
    },
    tagline: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    cardList: {
      gap: 12,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    sectorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    sectorCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectorName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    sectorCount: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}
