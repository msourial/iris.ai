import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { analyzeImage } from '@/lib/ai';
import { uploadToStoracha } from '@/lib/storacha';
import { mintVisionNFT } from '@/lib/flow';

let CameraView: any = null;
let useCameraPermissions: any = null;
let ImageManipulator: any = null;

if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch (e) {
    console.warn('[Iris] expo-camera not available');
  }
  try {
    ImageManipulator = require('expo-image-manipulator');
  } catch (e) {
    console.warn('[Iris] expo-image-manipulator not available');
  }
}

function usePermissions() {
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, async () => {}];
  return { permission, requestPermission };
}

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { setAiResult, setCapturedImageBase64, setBlockchainStatus } = useApp();
  const cameraRef = useRef<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { permission, requestPermission } = usePermissions();

  useEffect(() => {
    const timer = setTimeout(() => {
      Speech.speak('Camera ready. Double tap bottom of screen to analyze.');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnalyzing]);

  const takePicture = async () => {
    if (isAnalyzing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsAnalyzing(true);
    Speech.speak('Analyzing your surroundings.');

    try {
      let base64 = '';

      if (Platform.OS === 'web') {
        base64 = await captureFromWeb();
      } else {
        if (!cameraRef.current) {
          throw new Error('Camera not ready');
        }

        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
          exif: false,
        });

        if (ImageManipulator) {
          const compressed = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 768 } }],
            {
              compress: 0.75,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          base64 = compressed.base64 ?? photo.base64 ?? '';
        } else {
          base64 = photo.base64 ?? '';
        }
      }

      setCapturedImageBase64(base64);

      const result = await analyzeImage(base64);
      setAiResult(result);
      setIsAnalyzing(false);

      router.push('/result');

      setBlockchainStatus('uploading');
      uploadToStoracha(base64, result)
        .then(({ cid }) => {
          setBlockchainStatus('minting');
          return mintVisionNFT(cid);
        })
        .then(() => {
          setBlockchainStatus('done');
        })
        .catch((e) => {
          console.error('[Iris] Blockchain fusion error:', e);
          setBlockchainStatus('error');
        });
    } catch (e) {
      console.error('[Iris] Capture error:', e);
      setIsAnalyzing(false);
      Speech.speak('Analysis failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <WebCameraPlaceholder onCapture={takePicture} isAnalyzing={isAnalyzing} />
        {isAnalyzing && <AnalyzingOverlay pulse={pulseAnim} />}
        <Header insetTop={topPad} />
        {!isAnalyzing && (
          <CaptureButton onPress={takePicture} insetBottom={botPad} />
        )}
      </View>
    );
  }

  if (!permission) {
    return <LoadingScreen />;
  }

  if (!permission.granted) {
    return <PermissionScreen onRequest={requestPermission} insets={insets} />;
  }

  return (
    <View style={styles.container}>
      {CameraView && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
      )}

      <Header insetTop={topPad} />

      {isAnalyzing && <AnalyzingOverlay pulse={pulseAnim} />}

      {!isAnalyzing && (
        <CaptureButton onPress={takePicture} insetBottom={botPad} />
      )}
    </View>
  );
}

function Header({ insetTop }: { insetTop: number }) {
  return (
    <View style={[styles.header, { paddingTop: insetTop + 8 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Feather name="arrow-left" size={22} color={Colors.yellow} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>IRIS.AI</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function CaptureButton({
  onPress,
  insetBottom,
}: {
  onPress: () => void;
  insetBottom: number;
}) {
  return (
    <View style={[styles.captureContainer, { paddingBottom: insetBottom + 24 }]}>
      <TouchableOpacity
        style={styles.captureOuter}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityLabel="Capture and analyze"
        accessibilityRole="button"
        testID="capture-btn"
      >
        <View style={styles.captureInner} />
      </TouchableOpacity>
      <Text style={styles.captureHint}>Tap to Analyze</Text>
    </View>
  );
}

function AnalyzingOverlay({ pulse }: { pulse: Animated.Value }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.analyzingOverlay}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={styles.analyzingIconRing}>
            <ActivityIndicator size="large" color={Colors.yellow} />
          </View>
        </Animated.View>
        <Text style={styles.analyzingTitle}>ANALYZING</Text>
        <Text style={styles.analyzingSubtitle}>Reading your surroundings...</Text>
      </View>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.centeredScreen}>
      <ActivityIndicator size="large" color={Colors.yellow} />
    </View>
  );
}

function PermissionScreen({
  onRequest,
  insets,
}: {
  onRequest: () => void;
  insets: any;
}) {
  useEffect(() => {
    Speech.speak('Camera permission is required. Tap to grant access.');
  }, []);

  return (
    <View
      style={[
        styles.centeredScreen,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <Feather name="camera-off" size={64} color={Colors.yellow} />
      <Text style={styles.permissionTitle}>Camera Access Required</Text>
      <Text style={styles.permissionBody}>
        Iris.ai needs camera access to describe your surroundings.
      </Text>
      <TouchableOpacity style={styles.permissionButton} onPress={onRequest}>
        <Text style={styles.permissionButtonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );
}

function WebCameraPlaceholder({
  onCapture,
  isAnalyzing,
}: {
  onCapture: () => void;
  isAnalyzing: boolean;
}) {
  return (
    <View style={styles.webPlaceholder}>
      <Feather name="camera" size={80} color={Colors.yellow} />
      <Text style={styles.webPlaceholderTitle}>Camera Preview</Text>
      <Text style={styles.webPlaceholderBody}>
        Scan the QR code in the Replit URL bar to use Iris.ai on your device with Expo Go for full camera functionality.
      </Text>
    </View>
  );
}

async function captureFromWeb(): Promise<string> {
  await new Promise<void>((r) => setTimeout(r, 800));
  return '';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
  },
  headerSpacer: {
    width: 44,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  captureOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  captureInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.yellow,
  },
  captureHint: {
    color: Colors.yellow,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    opacity: 0.8,
  },
  analyzingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  analyzingIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingTitle: {
    color: Colors.yellow,
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 6,
  },
  analyzingSubtitle: {
    color: Colors.grayLight,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  permissionTitle: {
    color: Colors.yellow,
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  permissionBody: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  permissionButton: {
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 36,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  permissionButtonText: {
    color: Colors.black,
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  webPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
    paddingTop: 140,
  },
  webPlaceholderTitle: {
    color: Colors.yellow,
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  webPlaceholderBody: {
    color: Colors.grayLight,
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
});
