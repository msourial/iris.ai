import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { getHelpRequest, claimRequest, resolveRequest, type HelpRequest } from '@/lib/api';

export default function VolunteerRespondScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const volunteerAddr = user?.addr ?? 'volunteer';

  useEffect(() => {
    if (!requestId) return;

    (async () => {
      try {
        // Claim the request
        const claimed = await claimRequest(requestId, volunteerAddr);
        setRequest(claimed);
        setIsLoading(false);
        Speech.speak('Request claimed. Read the AI description, view the image, and type your answer.');
      } catch {
        // Might already be claimed or not exist — try getting it anyway
        try {
          const req = await getHelpRequest(requestId);
          setRequest(req);
          setIsLoading(false);
          if (req.status === 'resolved') {
            setError('This request has already been resolved.');
            Speech.speak('This request has already been resolved.');
          }
        } catch {
          setError('Could not load request.');
          setIsLoading(false);
          Speech.speak('Could not load request.');
        }
      }
    })();

    return () => { Speech.stop(); };
  }, [requestId, volunteerAddr]);

  const handleSubmit = async () => {
    if (!answer.trim() || !requestId || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await resolveRequest(requestId, volunteerAddr, answer.trim());
      setIsDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak('Thank you! Your answer has been sent to the user.');

      setTimeout(() => {
        router.back();
      }, 2500);
    } catch (e) {
      console.error('[Iris] Resolve error:', e);
      setIsSubmitting(false);
      Speech.speak('Could not submit answer. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={Colors.yellow} />
        <Text style={styles.loadingText}>Claiming request...</Text>
      </View>
    );
  }

  if (isDone) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad }]}>
        <Feather name="check-circle" size={80} color={Colors.success} />
        <Text style={styles.doneTitle}>Thank You!</Text>
        <Text style={styles.doneSubtitle}>Your answer has been sent.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad }]}>
        <Feather name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonLargeText}>Back to Queue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back to queue"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={Colors.yellow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HELP REQUEST</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="cpu" size={16} color={Colors.yellow} />
            <Text style={styles.sectionLabel}>AI Description</Text>
          </View>
          <Text style={styles.aiDescription}>{request?.aiDescription}</Text>
        </View>

        {/* IPFS Image Link */}
        {request?.imageCid && request.imageCid !== 'pending' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="image" size={16} color={Colors.yellow} />
              <Text style={styles.sectionLabel}>Captured Image</Text>
            </View>
            <Text style={styles.cidText}>IPFS: {request.imageCid.slice(0, 20)}...</Text>
          </View>
        )}

        {/* Answer Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="edit-3" size={16} color={Colors.yellow} />
            <Text style={styles.sectionLabel}>Your Answer</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="What do you see? Describe it for someone who cannot see..."
            placeholderTextColor={Colors.grayLight}
            value={answer}
            onChangeText={setAnswer}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Type your description of the image"
          />
        </View>
      </ScrollView>

      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, (!answer.trim() || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          activeOpacity={0.8}
          accessibilityLabel="Submit your answer to help the visually impaired user"
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.black} />
          ) : (
            <Feather name="send" size={22} color={Colors.black} />
          )}
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  aiDescription: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    lineHeight: 28,
    backgroundColor: Colors.grayDark,
    borderWidth: 1,
    borderColor: Colors.grayMid,
    borderRadius: 12,
    padding: 16,
  },
  cidText: {
    color: Colors.grayLight,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    backgroundColor: Colors.grayDark,
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
  },
  textInput: {
    backgroundColor: Colors.grayDark,
    borderWidth: 1.5,
    borderColor: Colors.yellow,
    borderRadius: 12,
    padding: 16,
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    minHeight: 120,
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  submitButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 16,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: Colors.black,
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  loadingText: {
    color: Colors.yellow,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  doneTitle: {
    color: Colors.success,
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  doneSubtitle: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  backButtonLarge: {
    borderWidth: 2,
    borderColor: Colors.yellow,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  backButtonLargeText: {
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
});
