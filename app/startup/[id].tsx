import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StartupProfile, StartupMedia } from '@/types';
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  MessageCircle,
  Heart,
  Globe,
  FileText,
  Download,
} from 'lucide-react-native';
import { Video as VideoPlayer, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StartupDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [startup, setStartup] = useState<StartupProfile | null>(null);
  const [media, setMedia] = useState<StartupMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchStartup();
      checkFavorite();
      recordView();
    }
  }, [id]);

  const fetchStartup = async () => {
    const { data, error } = await supabase
      .from('startup_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setStartup(data);
      fetchMedia(id);
    }
    setLoading(false);
  };

  const fetchMedia = async (startupId: string) => {
    const { data } = await supabase
      .from('startup_media')
      .select('*')
      .eq('startup_id', startupId)
      .order('display_order', { ascending: true });

    if (data) {
      setMedia(data);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('startup_id', id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const recordView = async () => {
    if (!user || !id || profile?.role === 'startup') return;

    await supabase.from('profile_views').insert({
      startup_id: id,
      viewer_id: user.id,
    });
  };

  const toggleFavorite = async () => {
    if (!user) return;

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('startup_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        startup_id: id,
      });
      setIsFavorite(true);
    }
  };

  const handleContact = async () => {
    if (!startup) return;

    const { data: existingConversation } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user?.id},recipient_id.eq.${startup.user_id}),and(sender_id.eq.${startup.user_id},recipient_id.eq.${user?.id})`
      )
      .limit(1)
      .maybeSingle();

    if (existingConversation || !existingConversation) {
      router.push({
        pathname: '/chat/[id]',
        params: { id: startup.user_id, name: startup.company_name },
      });
    }
  };

  const formatFunding = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
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

  if (!startup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Startup not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        {profile?.role === 'investor' && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}>
            <Heart
              size={24}
              color={isFavorite ? colors.error : colors.text}
              fill={isFavorite ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView>
        <View style={styles.content}>
          {media.filter(m => m.media_type === 'image').length > 0 && (
            <View style={styles.mediaSection}>
              <FlatList
                data={media.filter(m => m.media_type === 'image')}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.floor(
                    event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setCurrentImageIndex(index);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.file_url }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                )}
                keyExtractor={(item) => item.id}
              />
              {media.filter(m => m.media_type === 'image').length > 1 && (
                <View style={styles.pagination}>
                  {media.filter(m => m.media_type === 'image').map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentImageIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {media.filter(m => m.media_type === 'video').length > 0 && (
            <View style={styles.videoSection}>
              <Text style={styles.sectionTitle}>Videos</Text>
              {media.filter(m => m.media_type === 'video').map((item) => (
                <View key={item.id} style={styles.videoContainer}>
                  <VideoPlayer
                    source={{ uri: item.file_url }}
                    style={styles.video}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              {startup.company_name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.companyName}>{startup.company_name}</Text>

          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{startup.sector}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{startup.stage}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{startup.location}</Text>
          </View>

          {startup.funding_goal > 0 && (
            <View style={styles.fundingCard}>
              <TrendingUp size={24} color={colors.primary} />
              <View style={styles.fundingInfo}>
                <Text style={styles.fundingLabel}>Funding Goal</Text>
                <Text style={styles.fundingAmount}>
                  {formatFunding(startup.funding_goal)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {startup.description || 'No description available'}
            </Text>
          </View>

          {(startup.team_size || startup.founded_year || startup.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailsCard}>
                {startup.team_size && (
                  <View style={styles.detailRow}>
                    <Users size={18} color={colors.textSecondary} />
                    <Text style={styles.detailLabel}>Team Size</Text>
                    <Text style={styles.detailValue}>{startup.team_size}</Text>
                  </View>
                )}
                {startup.founded_year && (
                  <View style={styles.detailRow}>
                    <Calendar size={18} color={colors.textSecondary} />
                    <Text style={styles.detailLabel}>Founded</Text>
                    <Text style={styles.detailValue}>
                      {startup.founded_year}
                    </Text>
                  </View>
                )}
                {startup.website && (
                  <View style={styles.detailRow}>
                    <Globe size={18} color={colors.textSecondary} />
                    <Text style={styles.detailLabel}>Website</Text>
                    <Text
                      style={[styles.detailValue, styles.link]}
                      numberOfLines={1}>
                      {startup.website}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {media.filter(m => m.media_type === 'document').length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <View style={styles.documentsContainer}>
                {media.filter(m => m.media_type === 'document').map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.documentCard}
                    onPress={() => {
                      if (item.file_url) {
                        console.log('Download document:', item.file_url);
                      }
                    }}>
                    <FileText size={24} color={colors.primary} />
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {item.file_name}
                      </Text>
                      {item.file_size && (
                        <Text style={styles.documentSize}>
                          {(item.file_size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                    <Download size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {profile?.role === 'investor' && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContact}>
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Contact Startup</Text>
            </TouchableOpacity>
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    backButton: {
      padding: 8,
    },
    favoriteButton: {
      padding: 8,
    },
    content: {
      padding: 24,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      alignSelf: 'center',
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: '700',
    },
    companyName: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    tags: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 16,
    },
    tag: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    tagText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 24,
    },
    metaText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    fundingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.primary}15`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 12,
    },
    fundingInfo: {
      flex: 1,
    },
    fundingLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    fundingAmount: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    detailsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    detailLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    link: {
      color: colors.primary,
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      gap: 8,
      marginTop: 16,
    },
    contactButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    mediaSection: {
      marginBottom: 24,
    },
    carouselImage: {
      width: SCREEN_WIDTH,
      height: 300,
      backgroundColor: colors.card,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    paginationDotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    videoSection: {
      marginBottom: 24,
    },
    videoContainer: {
      marginBottom: 12,
    },
    video: {
      width: '100%',
      height: 250,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
    },
    documentsContainer: {
      gap: 12,
    },
    documentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    documentSize: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
