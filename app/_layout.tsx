import "../global.css";

// Polyfill for @onflow/fcl → @walletconnect (must load before FCL)
import "react-native-get-random-values";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
