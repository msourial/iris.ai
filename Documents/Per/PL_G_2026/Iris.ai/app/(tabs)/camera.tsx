/**
 * camera.tsx — Phase 3: AI Vision Camera
 *
 * Flow:
 *   1. Request camera permission on first open.
 *   2. Show live CameraView fullscreen.
 *   3. User taps the large yellow capture button.
 *   4. Photo is taken → DescriptionModal opens in "loading" state.
 *   5. describePhoto() sends compressed base64 to the Vision API.
 *   6. Modal updates with the description and announces it via
 *      AccessibilityInfo — the "Winner's Moment".
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DescriptionModal from "../../components/DescriptionModal";
import { describePhoto } from "../../lib/vision";

// ---------------------------------------------------------------------------
// Camera Screen
// ---------------------------------------------------------------------------

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [capturing, setCapturing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<string | null>(null);

  // ── Capture + AI flow ────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      // Take photo (no base64 here — we compress + encode in vision.ts)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error("Camera returned no photo URI");

      // Open modal immediately in loading state
      setDescription(null);
      setLoading(true);
      setModalVisible(true);

      // Hit the Vision API
      const result = await describePhoto(photo.uri);

      setLoading(false);
      setDescription(
        result.ok
          ? result.description
          : `Could not describe the image: ${result.error}`
      );
    } catch (err) {
      setLoading(false);
      setDescription(`Error: ${(err as Error).message}`);
      setModalVisible(true);
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setDescription(null);
  }, []);

  // ── Permission not yet determined ────────────────────────────────────────

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFD600" size="large" />
      </SafeAreaView>
    );
  }

  // ── Permission denied ────────────────────────────────────────────────────

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black px-8 items-center justify-center">
        <Text
          className="text-iris-yellow text-5xl mb-6"
          accessibilityElementsHidden
        >
          📷
        </Text>
        <Text
          className="text-white text-2xl font-black text-center mb-3"
          accessibilityRole="header"
        >
          Camera Access Needed
        </Text>
        <Text className="text-white/60 text-base text-center mb-10">
          Iris.ai needs camera access to describe what's in front of you.
        </Text>
        <Pressable
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          className="bg-iris-yellow rounded-2xl py-5 px-10 items-center w-full"
        >
          <Text className="text-black text-xl font-black">Allow Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Live camera view ─────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Full-screen camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        accessibilityLabel="Live camera view"
      />

      {/* Top label */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View className="px-5 pt-2">
          <View className="bg-black/60 rounded-2xl px-4 py-2 self-start">
            <Text className="text-iris-yellow text-sm font-bold tracking-widest uppercase">
              Iris.ai · AI Vision
            </Text>
          </View>
        </View>

        {/* Bottom capture controls */}
        <View className="pb-10 items-center gap-3">
          <Text className="text-white/70 text-sm font-semibold">
            {capturing ? "Processing…" : "Tap to describe the scene"}
          </Text>

          {/* Large capture button — massive touch target for accessibility */}
          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Capture photo and describe scene"
            accessibilityHint="Takes a photo and uses AI to describe what is in front of you"
            style={({ pressed }) => ({
              opacity: capturing ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <View style={styles.captureOuter}>
              <View style={styles.captureInner}>
                {capturing ? (
                  <ActivityIndicator color="#000" size="large" />
                ) : (
                  <Text style={{ fontSize: 32 }} accessibilityElementsHidden>
                    👁
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Result modal */}
      <DescriptionModal
        visible={modalVisible}
        description={description}
        loading={loading}
        onClose={handleModalClose}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles (layout needs StyleSheet — Tailwind can't do absolute positioning
// on the camera overlay cleanly)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  captureOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: "#FFD600",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  captureInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFD600",
    alignItems: "center",
    justifyContent: "center",
  },
});
