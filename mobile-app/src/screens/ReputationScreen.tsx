import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit-react-native";
import { useReputation, useTasks } from "../hooks/useContracts";
import { formatUnits } from "viem";

// ... TIERS config ...
const TIERS_ARRAY = ["None", "Bronze", "Silver", "Gold", "Platinum"];
const TIERS = {
  None: { name: "None", color: "#6b7280", emoji: "🌱", minTasks: 0 },
  Bronze: { name: "Bronze", color: "#cd7f32", emoji: "🥉", minTasks: 1 },
  Silver: { name: "Silver", color: "#9ca3af", emoji: "🥈", minTasks: 6 },
  Gold: { name: "Gold", color: "#fbbf24", emoji: "🥇", minTasks: 21 },
  Platinum: { name: "Platinum", color: "#a855f7", emoji: "👑", minTasks: 51 },
};

const getTaskEmoji = (type: string) => {
    if (type.includes("medical")) return "💊";
    if (type.includes("supply")) return "📦";
    if (type.includes("shelter")) return "⛺";
    return "🚨";
};

export default function ReputationScreen() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { data: profile, isLoading } = useReputation();
  const { tasks: allTasks } = useTasks();

  const myTasks = allTasks.filter(t => t.volunteer === address);

  // Map on-chain data to UI format
  const reputationScore = profile ? Number(profile.reputation) : 0;
  const tierIndex = profile ? profile.tier : 0;
  // Safe array access
  const tierName = (TIERS_ARRAY[tierIndex] || "None") as keyof typeof TIERS;
  const tier = TIERS[tierName];
  
  const stats = {
    tasksCompleted: profile ? Number(profile.tasksCompleted) : 0,
    totalRewards: profile ? formatUnits(profile.totalRewards, 6) : "0", // Corrected to 6 decimals
    tasksToNextTier: 0 // Logic to calculate this?
  };

  const handleConnect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    open();
  };

  if (!isConnected) {
    return (
        <View style={[styles.container, styles.centerContent]}>
            <Ionicons name="wallet-outline" size={64} color="#6366f1" />
            <Text style={styles.connectTitle}>Connect Wallet</Text>
            <Text style={styles.connectDesc}>Connect your wallet to view your Reputation & Impact NFT.</Text>
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
        </View>
    );
  }

  if (isLoading) {
      return (
          <View style={[styles.container, styles.centerContent]}>
              <ActivityIndicator size="large" color="#6366f1" />
          </View>
      );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reputation</Text>
        <TouchableOpacity onPress={() => open()}>
          <Ionicons name="wallet" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* NFT Card */}
      <View style={styles.nftCard}>
        <View style={styles.nftHeader}>
          <Text style={styles.nftLabel}>IMPACT NFT</Text>
          <View style={styles.soulboundBadge}>
            <Ionicons name="lock-closed" size={12} color="#a855f7" />
            <Text style={styles.soulboundText}>SOULBOUND</Text>
          </View>
        </View>

        {/* Tier Badge */}
        <View style={styles.tierContainer}>
          <Text style={styles.tierEmoji}>{tier.emoji}</Text>
          <Text style={[styles.tierName, { color: tier.color }]}>
            {tier.name}
          </Text>
        </View>

        {/* Reputation Score */}
        <View style={styles.reputationContainer}>
          <Text style={styles.reputationLabel}>Reputation Score</Text>
          <Text style={styles.reputationValue}>
            {(reputationScore / 100).toFixed(2)}
            <Text style={styles.reputationMax}> / 100.00</Text>
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(reputationScore / 10000) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={24} color="#eab308" />
            <Text style={styles.statValue}>${Number(stats.totalRewards).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>
      </View>

      {/* Tier Roadmap */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tier Progress</Text>
        <View style={styles.tierRoadmap}>
          {Object.entries(TIERS).slice(1).map(([key, value], index) => {
            const isActive = Object.keys(TIERS).slice(1).indexOf(tierName) >= index;
            return (
              <View key={key} style={styles.tierStep}>
                <View
                  style={[
                    styles.tierDot,
                    isActive && { backgroundColor: value.color },
                  ]}
                >
                  <Text style={styles.tierStepEmoji}>{value.emoji}</Text>
                </View>
                {index < 3 && (
                  <View
                    style={[
                      styles.tierLine,
                      isActive && { backgroundColor: value.color },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.tierLabels}>
          {Object.values(TIERS).slice(1).map((tier) => (
            <Text key={tier.name} style={styles.tierLabel}>{tier.minTasks}+</Text>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Tasks</Text>
        {myTasks.length === 0 ? (
            <Text style={{color: '#6b7280', fontStyle: 'italic'}}>No tasks completed yet.</Text>
        ) : (
            myTasks.map((task: any) => (
            <View key={task.id.toString()} style={styles.taskItem}>
                <View style={styles.taskIcon}>
                <Text style={styles.taskEmoji}>{getTaskEmoji(task.description)}</Text>
                </View>
                <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>Task #{task.id.toString()}</Text>
                <Text style={styles.taskDate}>Status: {task.status === 2 ? "Completed" : "Active"}</Text>
                </View>
                <View style={styles.taskReward}>
                <Text style={styles.rewardValue}>+${formatUnits(task.reward, 6)}</Text>
                </View>
            </View>
            ))
        )}
      </View>

      {/* Bottom padding */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  nftCard: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  nftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nftLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6366f1",
    letterSpacing: 2,
  },
  soulboundBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  soulboundText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#a855f7",
    marginLeft: 4,
  },
  tierContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  tierEmoji: {
    fontSize: 64,
  },
  tierName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  reputationContainer: {
    marginBottom: 24,
  },
  reputationLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  reputationValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  reputationMax: {
    fontSize: 16,
    color: "#6b7280",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  tierRoadmap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tierStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tierStepEmoji: {
    fontSize: 20,
  },
  tierLine: {
    width: 40,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tierLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tierLabel: {
    fontSize: 10,
    color: "#6b7280",
    width: 40,
    textAlign: "center",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 12,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  taskEmoji: {
    fontSize: 24,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  taskDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  taskReward: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#22c55e",
  },
  connectButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
  },
  connectTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginTop: 16
  },
  connectDesc: {
      fontSize: 16,
      color: '#9ca3af',
      textAlign: 'center',
      marginTop: 8
  }
});
