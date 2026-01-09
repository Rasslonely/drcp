import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Animated,
} from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function VictimDistressScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [signalSent, setSignalSent] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Request location permission
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location access is needed to send your distress signal."
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    // Pulse animation
    if (!signalSent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [signalSent]);

  const handleSOSPress = async () => {
    if (!location) {
      Alert.alert("Location not available", "Please enable location services.");
      return;
    }

    setIsPressed(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Simulate sending distress signal
    setIsSending(true);
    Vibration.vibrate([0, 200, 100, 200]);

    // Mock API call
    setTimeout(() => {
      setIsSending(false);
      setSignalSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="warning" size={32} color="#ef4444" />
        <Text style={styles.headerText}>Emergency Distress</Text>
      </View>

      {/* Main SOS Button */}
      <View style={styles.sosContainer}>
        {signalSent ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={100} color="#22c55e" />
            <Text style={styles.successText}>Signal Sent!</Text>
            <Text style={styles.successSubtext}>
              Help is on the way. Stay calm.
            </Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color="#6366f1" />
              <Text style={styles.locationText}>
                {location?.coords.latitude.toFixed(4)},{" "}
                {location?.coords.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.sosButton,
                isPressed && styles.sosButtonPressed,
                isSending && styles.sosButtonSending,
              ]}
              onPress={handleSOSPress}
              disabled={isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <Text style={styles.sosButtonText}>SENDING...</Text>
              ) : (
                <>
                  <Ionicons name="alert-circle" size={60} color="#fff" />
                  <Text style={styles.sosButtonText}>SOS</Text>
                  <Text style={styles.sosSubtext}>Tap for help</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Location Status */}
      {!signalSent && (
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Ionicons
              name={location ? "location" : "location-outline"}
              size={24}
              color={location ? "#22c55e" : "#9ca3af"}
            />
            <Text style={styles.statusText}>
              {location ? "Location acquired" : "Acquiring location..."}
            </Text>
          </View>
        </View>
      )}

      {/* Instructions */}
      {!signalSent && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Press the SOS button to send your location to emergency responders
            and nearby volunteers.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  sosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  sosButtonPressed: {
    backgroundColor: "#dc2626",
  },
  sosButtonSending: {
    backgroundColor: "#f59e0b",
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  sosSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 5,
  },
  successContainer: {
    alignItems: "center",
  },
  successText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#22c55e",
    marginTop: 20,
  },
  successSubtext: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 10,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  locationText: {
    color: "#6366f1",
    marginLeft: 8,
    fontFamily: "monospace",
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "#9ca3af",
    marginLeft: 8,
    fontSize: 14,
  },
  instructions: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  instructionText: {
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 22,
  },
});
