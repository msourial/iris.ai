import React, { useEffect, useRef } from 'react';
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

const BLOCKCHAIN_LABELS: Record<string, string> = {
  idle: '',
  uploading: 'Securing to IPFS...',
  minting: 'Minting to Flow...',
  done: '✓ Secured on Blockchain',
  error: 'Blockchain sync failed',
};

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const { aiResult, blockchainStatus, setAiResult, setBlockchainStatus } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
        Speech.speak(aiResult, {
          rate: 0.9,
          pitch: 1.0,
          language: 'en-US',
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [aiResult]);

  const handleAnalyzeAgain = () => {
    Speech.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiResult(null);
    setBlockchainStatus('idle');
    router.replace('/camera');
  };

  const handleReadAgain = () => {
    if (aiResult) {
      Speech.stop();
      setTimeout(() => {
        Speech.speak(aiResult, { rate: 0.9, pitch: 1.0, language: 'en-US' });
      }, 200);
    }
    Haptics.selectionAsync();
  };

  const blockchainLabel = BLOCKCHAIN_LABELS[blockchainStatus] ?? '';
  const blockchainColor =
    blockchainStatus === 'done'
      ? Colors.success
      : blockchainStatus === 'error'
      ? Colors.error
      : Colors.grayLight;

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
          {aiResult ? (
            <Text style={styles.resultText}>{aiResult}</Text>
          ) : (
            <Text style={styles.noResultText}>No result available.</Text>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomSection}>
        {blockchainLabel ? (
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
    borderColor: Colors.grayMid,
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
    borderColor: Colors.grayMid,
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
    color: Colors.grayLight,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
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
});
