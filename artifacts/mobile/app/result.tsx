import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { createHelpRequest, getHelpRequest } from '@/lib/api';

type HumanStage = 'idle' | 'freezing' | 'escrow' | 'resolved';

const BLOCKCHAIN_LABELS: Record<string, string> = {
  idle: '',
  uploading: 'Securing to IPFS...',
  minting: 'Minting to Flow...',
  done: '✓ Secured on Blockchain',
  error: 'Blockchain sync failed',
};

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const { aiResult, aiDescriptionHash, imageCid, blockchainStatus, user, setAiResult, setAiDescriptionHash, setImageCid, setBlockchainStatus, setCurrentRequestId } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [humanStage, setHumanStage] = useState<HumanStage>('idle');
  const [volunteerAnswer, setVolunteerAnswer] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [escrowTxId, setEscrowTxId] = useState<string | null>(null);
  const [filecoinCid, setFilecoinCid] = useState<string | null>(null);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (aiResult) {
      const timer = setTimeout(() => {
        Speech.speak(aiResult, { rate: 0.9, pitch: 1.0, language: 'en-US' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [aiResult]);

  useEffect(() => {
    if (humanStage === 'freezing' || humanStage === 'escrow') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [humanStage, pulseAnim]);

  const showToast = useCallback(() => {
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(toastAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [toastAnim]);

  useEffect(() => {
    return () => {
      stageTimers.current.forEach(clearTimeout);
      stageTimers.current = [];
      if (speechTimer.current) clearTimeout(speechTimer.current);
      if (pollRef.current) clearInterval(pollRef.current);
      Speech.stop();
    };
  }, []);

  const clearStageTimers = () => {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
  };

  const handleAskHuman = async () => {
    if (humanStage !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Speech.stop();

    setHumanStage('freezing');
    Speech.speak('Securing community bounty for a volunteer...', { rate: 0.9, language: 'en-US' });

    try {
      const helpReq = await createHelpRequest({
        blindUserAddr: user?.addr ?? 'anonymous',
        imageCid: imageCid ?? 'pending',
        aiDescription: aiResult ?? '',
        aiDescriptionHash: aiDescriptionHash ?? '',
      });
      setCurrentRequestId(helpReq.id);
      setEscrowTxId(helpReq.flowEscrowTxId);

      setHumanStage('escrow');
      Speech.speak('Request submitted. Waiting for a volunteer...', { rate: 0.9, language: 'en-US' });

      // Poll for volunteer response every 3 seconds
      pollRef.current = setInterval(async () => {
        try {
          const updated = await getHelpRequest(helpReq.id);
          if (updated.filecoinCid) setFilecoinCid(updated.filecoinCid);
          if (updated.status === 'resolved' && updated.volunteerAnswer) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;

            setVolunteerAnswer(updated.volunteerAnswer);
            setHumanStage('resolved');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setToastMessage(`Volunteer responded! Request resolved.`);
            speechTimer.current = setTimeout(() => {
              Speech.speak(updated.volunteerAnswer!, { rate: 0.85, pitch: 1.0, language: 'en-US' });
            }, 300);
            showToast();
          }
        } catch {
          // Polling error — continue silently
        }
      }, 3000);
    } catch (e) {
      console.error('[Iris] Ask human failed:', e);
      setHumanStage('idle');
      Speech.speak('Could not submit request. Please try again.', { rate: 0.9, language: 'en-US' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAnalyzeAgain = () => {
    Speech.stop();
    clearStageTimers();
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiResult(null);
    setAiDescriptionHash(null);
    setImageCid(null);
    setBlockchainStatus('idle');
    setHumanStage('idle');
    setVolunteerAnswer(null);
    setCurrentRequestId(null);
    router.replace('/camera');
  };

  const handleReadAgain = () => {
    const textToRead =
      humanStage === 'resolved' && volunteerAnswer ? volunteerAnswer : aiResult ?? '';
    const rate = humanStage === 'resolved' ? 0.85 : 0.9;
    if (textToRead) {
      Speech.stop();
      setTimeout(() => {
        Speech.speak(textToRead, { rate, pitch: 1.0, language: 'en-US' });
      }, 200);
    }
    Haptics.selectionAsync();
  };

  const blockchainLabel = BLOCKCHAIN_LABELS[blockchainStatus] ?? '';
  const blockchainColor = Colors.yellow;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleAnalyzeAgain}
          accessibilityLabel="Analyze again"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={Colors.yellow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IRIS RESULT</Text>
        <TouchableOpacity
          style={styles.speakButton}
          onPress={handleReadAgain}
          accessibilityLabel="Read result again"
          accessibilityRole="button"
        >
          <Feather name="volume-2" size={22} color={Colors.yellow} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {humanStage === 'resolved' && volunteerAnswer ? (
            <View style={styles.resolvedBlock}>
              <View style={styles.volunteerBadge}>
                <Feather name="user-check" size={18} color={Colors.black} />
                <Text style={styles.volunteerBadgeText}>Volunteer Answer</Text>
              </View>
              <Text style={styles.resultText}>{volunteerAnswer}</Text>
            </View>
          ) : aiResult ? (
            <Text style={styles.resultText}>{aiResult}</Text>
          ) : (
            <Text style={styles.noResultText}>No result available.</Text>
          )}

          {/* Verification Proofs */}
          {(aiDescriptionHash || imageCid || blockchainStatus === 'done') && (
            <View style={styles.proofSection}>
              <View style={styles.proofHeader}>
                <Feather name="shield" size={16} color={Colors.yellow} />
                <Text style={styles.proofHeaderText}>VERIFICATION</Text>
              </View>

              {aiDescriptionHash && (
                <ProofRow
                  icon="cpu"
                  label="AI Proof"
                  value={`sha256:${aiDescriptionHash.slice(0, 16)}...`}
                />
              )}

              {imageCid && (
                <ProofRow
                  icon="hard-drive"
                  label="IPFS"
                  value={imageCid.slice(0, 20) + '...'}
                />
              )}

              {blockchainStatus === 'done' && (
                <ProofRow
                  icon="link"
                  label="Flow"
                  value="Secured on-chain"
                />
              )}

              {filecoinCid && (
                <ProofRow
                  icon="database"
                  label="Filecoin"
                  value={filecoinCid.slice(0, 20) + '...'}
                />
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {humanStage === 'idle' && (
        <View style={styles.askHumanWrapper}>
          <TouchableOpacity
            style={styles.askHumanButton}
            onPress={handleAskHuman}
            activeOpacity={0.85}
            accessibilityLabel="Ask a human volunteer for help. This is free and community sponsored."
            accessibilityRole="button"
            testID="ask-human-btn"
          >
            <Feather name="users" size={26} color={Colors.black} />
            <Text style={styles.askHumanText}>Ask a Human (Free – Sponsored)</Text>
          </TouchableOpacity>
          <Text style={styles.askHumanSubtext}>For critical details like expiration dates.</Text>
        </View>
      )}

      {(humanStage === 'freezing' || humanStage === 'escrow') && (
        <Animated.View style={[styles.stagePanel, { transform: [{ scale: pulseAnim }] }]}>
          <StageContent stage={humanStage} txId={escrowTxId} />
        </Animated.View>
      )}

      <View style={styles.bottomSection}>
        {blockchainLabel && humanStage === 'idle' ? (
          <Text style={[styles.blockchainStatus, { color: blockchainColor }]}>
            {blockchainLabel}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.readAgainButton}
          onPress={handleReadAgain}
          activeOpacity={0.8}
          accessibilityLabel="Read result again"
          accessibilityRole="button"
          testID="read-again-btn"
        >
          <Feather name="volume-2" size={24} color={Colors.black} />
          <Text style={styles.readAgainText}>Read Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.analyzeAgainButton}
          onPress={handleAnalyzeAgain}
          activeOpacity={0.8}
          accessibilityLabel="Analyze again"
          accessibilityRole="button"
          testID="analyze-again-btn"
        >
          <Feather name="camera" size={22} color={Colors.yellow} />
          <Text style={styles.analyzeAgainText}>Analyze Again</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.toast, { opacity: toastAnim }]}
        pointerEvents="none"
      >
        <Feather name="zap" size={14} color={Colors.black} />
        <Text style={styles.toastText}>{toastMessage || 'Volunteer responded!'}</Text>
      </Animated.View>
    </View>
  );
}

function ProofRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.proofRow}>
      <Feather name={icon as any} size={14} color={Colors.yellow} />
      <Text style={styles.proofLabel}>{label}</Text>
      <Text style={styles.proofValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function StageContent({ stage, txId }: { stage: HumanStage; txId: string | null }) {
  if (stage === 'freezing') {
    return (
      <>
        <Feather name="upload-cloud" size={36} color={Colors.yellow} />
        <Text style={styles.stageTitle}>Submitting Request</Text>
        <Text style={styles.stageSubtitle}>Sending to volunteer network...</Text>
      </>
    );
  }
  if (stage === 'escrow') {
    return (
      <>
        <Feather name="clock" size={36} color={Colors.yellow} />
        <Text style={styles.stageTitle}>Waiting for Volunteer</Text>
        {txId && <Text style={styles.stageTxId}>{txId}</Text>}
        <Text style={styles.stageSubtitle}>A sighted volunteer will respond shortly...</Text>
      </>
    );
  }
  return null;
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
  speakButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.yellow,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  resultText: {
    color: Colors.yellow,
    fontSize: 26,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 42,
    textAlign: 'left',
  },
  noResultText: {
    color: Colors.yellow,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.5,
  },
  resolvedBlock: {
    gap: 16,
  },
  volunteerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.yellow,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  volunteerBadgeText: {
    color: Colors.black,
    fontSize: 13,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  askHumanWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'stretch',
  },
  askHumanButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 16,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  askHumanText: {
    color: Colors.black,
    fontSize: 19,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    flexShrink: 1,
  },
  askHumanSubtext: {
    color: Colors.yellow,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.6,
  },
  stagePanel: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: Colors.black,
    borderWidth: 1.5,
    borderColor: Colors.yellow,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  stageTitle: {
    color: Colors.yellow,
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  stageSubtitle: {
    color: Colors.yellow,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.6,
  },
  stageTxId: {
    color: Colors.yellow,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    opacity: 0.6,
    letterSpacing: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  blockchainStatus: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.9,
  },
  readAgainButton: {
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
  readAgainText: {
    color: Colors.black,
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  analyzeAgainButton: {
    borderWidth: 2,
    borderColor: Colors.yellow,
    borderRadius: 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  analyzeAgainText: {
    color: Colors.yellow,
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: Colors.yellow,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  toastText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  proofSection: {
    marginTop: 24,
    backgroundColor: Colors.grayDark,
    borderWidth: 1,
    borderColor: Colors.grayMid,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  proofHeaderText: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proofLabel: {
    color: Colors.grayLight,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    width: 70,
  },
  proofValue: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    opacity: 0.8,
  },
});
