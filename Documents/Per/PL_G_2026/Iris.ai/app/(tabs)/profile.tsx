import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-iris-yellow text-3xl font-bold mb-4 text-center">
          Profile
        </Text>
        <Text className="text-white text-lg text-center opacity-60">
          Coming in Phase 2 — Flow Passkey Auth
        </Text>
      </View>
    </SafeAreaView>
  );
}
