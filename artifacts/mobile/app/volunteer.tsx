import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { listPendingRequests, type HelpRequest } from '@/lib/api';

export default function VolunteerScreen() {
  const insets = useSafeAreaInsets();
  const { setRole } = useApp();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fetchRequests = useCallback(async () => {
    try {
      const pending = await listPendingRequests();
      setRequests(pending);
      setError(null);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setError('Could not connect to server. Retrying...');
    }
  }, []);

  useEffect(() => {
    Speech.speak('Volunteer queue. Pending requests will appear here.');
    fetchRequests();
    pollRef.current = setInterval(fetchRequests, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      Speech.stop();
    };
  }, [fetchRequests]);

  const handleHelp = (request: HelpRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/volunteer-respond', params: { requestId: request.id } });
  };

  const handleBack = () => {
    setRole(null);
    router.replace('/');
  };

  const timeAgo = (iso: string): string => {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  const renderItem = ({ item }: { item: HelpRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Feather name="eye" size={18} color={Colors.yellow} />
        <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {item.aiDescription}
      </Text>
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => handleHelp(item)}
        activeOpacity={0.8}
        accessibilityLabel={`Help with request: ${item.aiDescription.slice(0, 50)}`}
        accessibilityRole="button"
      >
        <Feather name="heart" size={20} color={Colors.black} />
        <Text style={styles.helpButtonText}>Help</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back to role selection"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={Colors.yellow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VOLUNTEER</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error && !isLoading && (
        <View style={styles.errorBanner}>
          <Feather name="wifi-off" size={16} color={Colors.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={Colors.yellow} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centeredContent}>
          <Feather name="inbox" size={64} color={Colors.grayMid} />
          <Text style={styles.emptyTitle}>No Requests Right Now</Text>
          <Text style={styles.emptySubtitle}>
            You are helping the community. New requests will appear automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.yellow,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
  },
  headerSpacer: {
    width: 44,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  loadingText: {
    color: Colors.yellow,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  emptyTitle: {
    color: Colors.yellow,
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.grayLight,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.grayDark,
    borderWidth: 1,
    borderColor: Colors.grayMid,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    color: Colors.grayLight,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  cardDescription: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  helpButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  helpButtonText: {
    color: Colors.black,
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.grayLight,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
});
