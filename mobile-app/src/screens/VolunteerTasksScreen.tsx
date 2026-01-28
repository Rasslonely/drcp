import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit-react-native";
import { useTasks, useClaimTask } from "../hooks/useContracts";
import { formatUnits } from "viem";

// Helper to deduce type from description or hash (mock logic for demo)
const getTypeFromDesc = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes("medical")) return "medical";
    if (d.includes("water") || d.includes("food")) return "supply";
    if (d.includes("shelter") || d.includes("tent")) return "shelter";
    return "rescue";
};

export default function VolunteerTasksScreen({ navigation }: any) {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { tasks, isLoading, refetch } = useTasks();
  const { claim, isPending } = useClaimTask();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  const handleClaim = async (taskId: bigint) => {
    if (!isConnected) {
        Alert.alert("Connect Wallet", "You must connect your wallet to claim tasks.", [
            { text: "Cancel", style: "cancel" },
            { text: "Connect", onPress: () => open() }
        ]);
        return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
        claim(taskId);
    } catch (e) {
        Alert.alert("Error", "Failed to claim task. It might be already claimed.");
    }
  };

  const renderTask = ({ item }: { item: any }) => {
    // Mapping contract struct to UI
    // Contract: { id, description, reward, status, geoHash ... }
    const isClaimed = item.status !== 0; // 0 = OPEN
    const type = getTypeFromDesc(item.description);
    const rewardFormatted = formatUnits(item.reward, 6); // MockUSDC is 6 decimals

    return (
      <TouchableOpacity
        style={[styles.taskCard, isClaimed && styles.taskCardAccepted]}
        activeOpacity={0.8}
        disabled={isClaimed}
      >
        {/* Header */}
        <View style={styles.taskHeader}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: `rgba(99, 102, 241, 0.2)` },
            ]}
          >
            <Ionicons
              name={type === 'medical' ? 'medkit' : 'cube'}
              size={24}
              color="#6366f1"
            />
          </View>
          <View style={styles.taskHeaderText}>
            <Text style={styles.taskTitle}>Task #{item.id.toString()}</Text>
            <View style={styles.taskMeta}>
              <Ionicons name="location" size={14} color="#9ca3af" />
              <Text style={styles.taskLocation}>Lat: {item.geoHash.substring(0,6)}...</Text>
            </View>
          </View>
          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: `#ef444420` },
            ]}
          >
            <Text
              style={[
                styles.urgencyText,
                { color: '#ef4444' },
              ]}
            >
              HIGH
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.taskDescription}>{item.description}</Text>

        {/* Footer */}
        <View style={styles.taskFooter}>
          <View style={styles.locationContainer}>
             {/* ... */}
          </View>
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardText}>${rewardFormatted} USDC</Text>
          </View>
        </View>

        {/* Claim/Submit Proof Button */}
        {isClaimed ? (
          <View style={styles.claimedActions}>
             {item.status === 1 ? ( // 1 = CLAIMED
                <TouchableOpacity
                    style={styles.submitProofButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // @ts-ignore
                        navigation.navigate("Proof", { taskId: item.id.toString() });
                    }}
                >
                    <Ionicons name="camera" size={18} color="#fff" />
                    <Text style={styles.submitProofButtonText}>Submit Proof</Text>
                </TouchableOpacity>
             ) : (
                <View style={styles.acceptedBanner}>
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    <Text style={styles.acceptedText}>
                        {item.status === 2 ? "Proof Pending" : item.status === 3 ? "Verified" : "Paid"}
                    </Text>
                </View>
             )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleClaim(item.id)}
            disabled={isPending}
          >
            {isPending ? <ActivityIndicator color="#fff" /> : (
                <>
                <Text style={styles.acceptButtonText}>Claim Task</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
      return (
          <View style={styles.container}>
             <ActivityIndicator size="large" color="#6366f1" style={{marginTop: 50}} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Tasks</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{tasks.length} tasks nearby</Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
            <Text style={{color: '#6b7280', textAlign: 'center', marginTop: 20}}>
                No tasks available based on your location.
            </Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerStats: {
    marginTop: 8,
  },
  statsText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  taskCardAccepted: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  taskHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  taskLocation: {
    color: "#9ca3af",
    fontSize: 12,
    marginLeft: 4,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  taskDescription: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    color: "#6366f1",
    fontSize: 12,
    marginLeft: 6,
  },
  rewardContainer: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardText: {
    color: "#22c55e",
    fontWeight: "bold",
    fontSize: 14,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },
  acceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  acceptedText: {
    color: "#22c55e",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  claimedActions: {
    marginTop: 8,
  },
  submitProofButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  submitProofButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
