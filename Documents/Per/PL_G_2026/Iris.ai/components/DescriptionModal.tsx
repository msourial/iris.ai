/**
 * DescriptionModal.tsx
 *
 * High-contrast full-screen modal that displays the AI-generated image
 * description.  Automatically reads the description aloud via
 * AccessibilityInfo.announceForAccessibility the moment it appears — this is
 * the "Winner's Moment".
 */

import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  visible: boolean;
  description: string | null;
  /** True while the AI is still processing the photo */
  loading: boolean;
  /** Called when the user dismisses the modal */
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DescriptionModal({
  visible,
  description,
  loading,
  onClose,
}: Props) {
  // Announce the description the instant it arrives — the core accessibility
  // moment: user takes photo → hears description without touching the screen.
  useEffect(() => {
    if (visible && description && !loading) {
      AccessibilityInfo.announceForAccessibility(description);
    }
  }, [visible, description, loading]);

  const handleReadAgain = useCallback(() => {
    if (description) {
      AccessibilityInfo.announceForAccessibility(description);
    }
  }, [description]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      accessibilityViewIsModal
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black px-6 pt-16 pb-10">
        {/* ── Header ───────────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-8">
          <Text
            className="text-iris-yellow text-2xl font-black tracking-tight"
            accessibilityRole="header"
          >
            Vision Result
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close result"
            hitSlop={16}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            className="border border-white/20 rounded-xl px-4 py-2"
          >
            <Text className="text-white text-sm font-semibold">✕ Close</Text>
          </Pressable>
        </View>

        {/* ── Eye icon ─────────────────────────────────────── */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-iris-yellow items-center justify-center">
            <Text style={{ fontSize: 38 }} accessibilityElementsHidden>
              👁
            </Text>
          </View>
        </View>

        {/* ── Content ──────────────────────────────────────── */}
        {loading ? (
          <View className="flex-1 items-center justify-center gap-4">
            <ActivityIndicator color="#FFD600" size="large" />
            <Text className="text-iris-yellow text-lg font-semibold text-center">
              Analysing image…
            </Text>
            <Text className="text-white/50 text-sm text-center">
              The AI is reading the scene for you
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text
              className="text-white text-2xl font-semibold leading-relaxed"
              accessibilityLabel={description ?? ""}
              accessibilityLiveRegion="polite"
            >
              {description ?? "No description available."}
            </Text>
          </ScrollView>
        )}

        {/* ── Actions ──────────────────────────────────────── */}
        {!loading && description && (
          <View className="gap-3 mt-6">
            {/* Read Again — primary CTA for visually-impaired users */}
            <Pressable
              onPress={handleReadAgain}
              accessibilityRole="button"
              accessibilityLabel="Read description again"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              className="w-full bg-iris-yellow rounded-2xl py-5 items-center"
            >
              <Text className="text-black text-xl font-black">
                🔊  Read Again
              </Text>
            </Pressable>

            {/* Close */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close and take another photo"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="w-full border border-white/20 rounded-2xl py-4 items-center"
            >
              <Text className="text-white text-base font-semibold">
                Take Another Photo
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
