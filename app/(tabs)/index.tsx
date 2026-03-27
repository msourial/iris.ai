import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useFlowAuth } from "../../hooks/useFlowAuth";

// Truncate a Flow address for display: 0x1234…cdef
function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function HomeScreen() {
  const { status, account, hasBiometrics, connect, disconnect } = useFlowAuth();

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const handleConnect = useCallback(async () => {
    if (isConnected) {
      await disconnect();
      AccessibilityInfo.announceForAccessibility("Wallet disconnected.");
    } else {
      AccessibilityInfo.announceForAccessibility(
        "Authenticating with Face ID. Please look at your device."
      );
      await connect();
      if (isConnected) {
        AccessibilityInfo.announceForAccessibility("Wallet connected.");
      }
    }
  }, [isConnected, isConnecting, connect, disconnect]);

  const handleRequestHelp = useCallback(() => {
    // Phase 3: will open camera + AI vision flow
    AccessibilityInfo.announceForAccessibility(
      "Help request initiated. Connecting you now."
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* ── Header ─────────────────────────────────────────── */}
      <View className="px-6 pt-6 pb-2 flex-row items-start justify-between">
        <View>
          <Text
            className="text-iris-yellow text-5xl font-black tracking-tight"
            accessibilityRole="header"
          >
            Iris.ai
          </Text>
          <Text className="text-white text-sm mt-1 opacity-60 font-medium tracking-wide">
            AI VISION · FLOW BLOCKCHAIN
          </Text>
        </View>

        {/* Network badge */}
        <View className="bg-iris-gray border border-white/10 rounded-xl px-3 py-2 items-center mt-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-iris-yellow" />
            <Text className="text-iris-yellow text-xs font-bold tracking-widest uppercase">
              Testnet
            </Text>
          </View>
        </View>
      </View>

      {/* ── Wallet / Passkey card ───────────────────────────── */}
      <View className="mx-6 mt-5">
        {isConnected && account ? (
          /* Connected state */
          <View className="bg-iris-gray border border-iris-yellow/30 rounded-2xl px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              {/* Green dot */}
              <View className="w-3 h-3 rounded-full bg-green-400" />
              <View>
                <Text className="text-green-400 text-xs font-bold tracking-widest uppercase">
                  Wallet Connected
                </Text>
                <Text
                  className="text-white text-base font-mono mt-0.5"
                  accessibilityLabel={`Flow address: ${account.address}`}
                >
                  {truncateAddress(account.address)}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleConnect}
              accessibilityRole="button"
              accessibilityLabel="Disconnect wallet"
              className="border border-white/20 rounded-xl px-3 py-1.5"
            >
              <Text className="text-white/60 text-xs font-semibold">
                Disconnect
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Disconnected / connecting state */
          <Pressable
            onPress={handleConnect}
            disabled={isConnecting}
            accessibilityRole="button"
            accessibilityLabel={
              isConnecting
                ? "Authenticating with Face ID"
                : hasBiometrics
                ? "Connect wallet with Face ID"
                : "Connect wallet"
            }
            accessibilityHint="Uses your device biometrics — no seed phrase required"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            className="bg-iris-gray border border-iris-yellow/60 rounded-2xl px-5 py-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              {/* Amber dot */}
              <View className="w-3 h-3 rounded-full bg-iris-yellow/50" />
              <View>
                <Text className="text-iris-yellow/70 text-xs font-bold tracking-widest uppercase">
                  {isConnecting ? "Authenticating…" : "No Wallet"}
                </Text>
                <Text className="text-white/50 text-sm mt-0.5">
                  {isConnecting
                    ? "Look at your device"
                    : hasBiometrics
                    ? "Tap to connect with Face ID"
                    : "Tap to connect"}
                </Text>
              </View>
            </View>
            {isConnecting ? (
              <ActivityIndicator color="#FFD600" size="small" />
            ) : (
              <View className="bg-iris-yellow rounded-xl px-4 py-2">
                <Text className="text-black text-sm font-black">
                  {hasBiometrics ? "  " : "Connect"}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* ── Main CTA ───────────────────────────────────────── */}
      <View className="flex-1 justify-center px-6 mt-4">
        <Pressable
          onPress={handleRequestHelp}
          disabled={!isConnected}
          accessibilityRole="button"
          accessibilityLabel="Request Help"
          accessibilityHint={
            isConnected
              ? "Activates the camera and connects you with an AI vision assistant"
              : "Connect your wallet first"
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          className={[
            "w-full rounded-3xl py-10 px-8 items-center justify-center",
            isConnected ? "bg-iris-yellow" : "bg-iris-gray border border-white/10",
          ].join(" ")}
        >
          <Text
            className="text-7xl mb-3"
            style={{ color: isConnected ? "#000" : "#444" }}
            accessibilityElementsHidden
          >
            👁
          </Text>
          <Text
            className="text-4xl font-black tracking-tight text-center leading-tight"
            style={{ color: isConnected ? "#000000" : "#555555" }}
          >
            Request{"\n"}Help
          </Text>
          <Text
            className="text-base font-semibold mt-4 text-center"
            style={{ color: isConnected ? "rgba(0,0,0,0.6)" : "#444" }}
          >
            {isConnected
              ? "Tap to start an AI vision session"
              : "Connect wallet above to begin"}
          </Text>
        </Pressable>

        {/* ── Sub-action cards ─────────────────────────────── */}
        <View className="flex-row justify-between mt-5 gap-3">
          <View className="flex-1 bg-iris-gray rounded-2xl py-5 items-center justify-center border border-white/10">
            <Text
              className="text-2xl mb-1"
              accessibilityElementsHidden
            >
              📷
            </Text>
            <Text className="text-white text-sm font-semibold">Camera</Text>
            <Text className="text-white/30 text-xs mt-0.5">Phase 3</Text>
          </View>

          <View
            className={[
              "flex-1 rounded-2xl py-5 items-center justify-center border",
              isConnected
                ? "bg-iris-yellow/10 border-iris-yellow/30"
                : "bg-iris-gray border-white/10",
            ].join(" ")}
          >
            <Text
              className="text-2xl mb-1"
              accessibilityElementsHidden
            >
              {isConnected ? "✅" : "🔗"}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: isConnected ? "#FFD600" : "#fff" }}
            >
              Wallet
            </Text>
            <Text
              className="text-xs mt-0.5"
              style={{ color: isConnected ? "rgba(255,214,0,0.5)" : "rgba(255,255,255,0.3)" }}
            >
              {isConnected ? "Connected" : "Phase 2"}
            </Text>
          </View>

          <View className="flex-1 bg-iris-gray rounded-2xl py-5 items-center justify-center border border-white/10">
            <Text
              className="text-2xl mb-1"
              accessibilityElementsHidden
            >
              🕐
            </Text>
            <Text className="text-white text-sm font-semibold">History</Text>
            <Text className="text-white/30 text-xs mt-0.5">Phase 3</Text>
          </View>
        </View>
      </View>

      {/* ── Footer ─────────────────────────────────────────── */}
      <View className="px-6 pb-4 items-center">
        <Text className="text-white/20 text-xs text-center tracking-wide">
          POWERED BY FLOW BLOCKCHAIN · STORACHA IPFS
        </Text>
      </View>
    </SafeAreaView>
  );
}
