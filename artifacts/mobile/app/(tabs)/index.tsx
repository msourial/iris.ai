import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { authenticate, formatAddr } from '@/lib/flow';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user, role, login, setRole } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      Speech.speak('Welcome to Iris. Tap the Connect Wallet button to begin.');
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(role === 'volunteer' ? '/volunteer' : '/camera');
    }
  }, [isAuthenticated, role]);

  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    Speech.speak('Connecting your wallet.');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const flowUser = await authenticate();
      login(flowUser);
      Speech.speak('Wallet connected. Choose how you want to use Iris.');
    } catch (e) {
      console.error('[Iris] Auth error:', e);
      setIsConnecting(false);
      Speech.speak('Connection failed. Please try again.');
    }
  };

  const handleRoleSelect = (selectedRole: 'blind' | 'volunteer') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRole(selectedRole);
    if (selectedRole === 'blind') {
      Speech.speak('Opening camera.');
    } else {
      Speech.speak('Opening volunteer queue.');
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Show role selection after wallet is connected
  if (isAuthenticated && !role) {
    return (
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>IRIS.AI</Text>
          <Text style={styles.tagline}>How would you like to help?</Text>
          {user && <Text style={styles.addrText}>{formatAddr(user.addr)}</Text>}
        </View>

        <View style={styles.roleSection}>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => handleRoleSelect('blind')}
            activeOpacity={0.8}
            accessibilityLabel="I need help seeing. Tap to use the camera for AI vision assistance."
            accessibilityRole="button"
          >
            <Feather name="eye" size={32} color={Colors.black} />
            <Text style={styles.roleButtonTitle}>I Need Help</Text>
            <Text style={styles.roleButtonSubtitle}>Get AI + human descriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleButtonOutline}
            onPress={() => handleRoleSelect('volunteer')}
            activeOpacity={0.8}
            accessibilityLabel="I want to volunteer. Tap to help visually impaired users by describing images."
            accessibilityRole="button"
          >
            <Feather name="heart" size={32} color={Colors.yellow} />
            <Text style={styles.roleButtonOutlineTitle}>I Want to Volunteer</Text>
            <Text style={styles.roleButtonOutlineSubtitle}>Help others see the world</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.networkText}>Flow Testnet · Storacha · Gemini Vision</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.logoSection}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>IRIS.AI</Text>
        <Text style={styles.tagline}>Decentralized Vision Assistant</Text>
        <Text style={styles.subtitle}>For the Visually Impaired</Text>
      </View>

      <View style={styles.featuresSection}>
        <FeatureRow icon="◎" label="AI Scene Description" />
        <FeatureRow icon="⬡" label="Flow Blockchain Verified" />
        <FeatureRow icon="⬡" label="IPFS Decentralized Storage" />
      </View>

      <View style={styles.bottomSection}>
        {isConnecting ? (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="large" color={Colors.yellow} />
            <Text style={styles.connectingText}>Connecting Wallet...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            activeOpacity={0.8}
            accessibilityLabel="Connect Wallet to begin"
            accessibilityRole="button"
            testID="connect-wallet-btn"
          >
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        )}

        {user && (
          <Text style={styles.addrText}>{formatAddr(user.addr)}</Text>
        )}

        <Text style={styles.networkText}>Flow Testnet · Storacha · Gemini Vision</Text>
      </View>
    </View>
  );
}

function FeatureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.grayDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.yellow,
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.yellow,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.yellow,
    fontFamily: 'Inter_500Medium',
    marginTop: 6,
    opacity: 0.9,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.grayLight,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  featuresSection: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.grayMid,
    borderRadius: 12,
    backgroundColor: Colors.grayDark,
  },
  featureIcon: {
    fontSize: 20,
    color: Colors.yellow,
  },
  featureLabel: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  bottomSection: {
    gap: 16,
    paddingBottom: 12,
  },
  connectButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 16,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  connectButtonText: {
    color: Colors.black,
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  connectingContainer: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.yellow,
    borderRadius: 16,
  },
  connectingText: {
    color: Colors.yellow,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  addrText: {
    color: Colors.yellowDim,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  networkText: {
    color: Colors.grayLight,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    paddingBottom: 12,
  },
  roleSection: {
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  roleButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  roleButtonTitle: {
    color: Colors.black,
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  roleButtonSubtitle: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  roleButtonOutline: {
    borderWidth: 2,
    borderColor: Colors.yellow,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  roleButtonOutlineTitle: {
    color: Colors.yellow,
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  roleButtonOutlineSubtitle: {
    color: Colors.yellow,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.6,
  },
});
