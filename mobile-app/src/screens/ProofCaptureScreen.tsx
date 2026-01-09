import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function ProofCaptureScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#6366f1" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture proof of task completion.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setPhoto(result.uri);
    }
  };

  const retakePicture = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
  };

  const submitProof = async () => {
    if (!photo || !location) {
      Alert.alert("Missing data", "Photo and location are required.");
      return;
    }

    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate API submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#22c55e" />
          <Text style={styles.successTitle}>Proof Submitted!</Text>
          <Text style={styles.successText}>
            Your task completion has been verified and submitted to the
            blockchain.
          </Text>
          <View style={styles.proofDetails}>
            <View style={styles.proofDetailRow}>
              <Ionicons name="location" size={20} color="#6366f1" />
              <Text style={styles.proofDetailText}>
                {location?.coords.latitude.toFixed(4)},{" "}
                {location?.coords.longitude.toFixed(4)}
              </Text>
            </View>
            <View style={styles.proofDetailRow}>
              <Ionicons name="time" size={20} color="#6366f1" />
              <Text style={styles.proofDetailText}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newProofButton}
            onPress={() => {
              setPhoto(null);
              setIsSubmitted(false);
            }}
          >
            <Text style={styles.newProofButtonText}>Submit Another Proof</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.headerTitle}>Capture Proof</Text>
      </View>

      {photo ? (
        // Photo Preview
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />

          {/* Location overlay */}
          <View style={styles.locationOverlay}>
            <Ionicons name="location" size={16} color="#6366f1" />
            <Text style={styles.locationOverlayText}>
              {location
                ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
                : "Acquiring location..."}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={retakePicture}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonLoading,
              ]}
              onPress={submitProof}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Proof</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Camera View
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          >
            {/* Camera overlay */}
            <View style={styles.cameraOverlay}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>

            {/* Location indicator */}
            <View style={styles.locationIndicator}>
              <Ionicons
                name={location ? "location" : "location-outline"}
                size={16}
                color={location ? "#22c55e" : "#f59e0b"}
              />
              <Text
                style={[
                  styles.locationIndicatorText,
                  { color: location ? "#22c55e" : "#f59e0b" },
                ]}
              >
                {location ? "GPS Ready" : "Acquiring GPS..."}
              </Text>
            </View>
          </CameraView>

          {/* Capture button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() =>
                setFacing((current) =>
                  current === "back" ? "front" : "back"
                )
              }
            >
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.flipButton} />
          </View>
        </View>
      )}

      {/* Instructions */}
      {!photo && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Take a photo as proof of task completion. Your GPS location will be
            automatically attached.
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
  },
  permissionText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    margin: 40,
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderBottomRightRadius: 12,
  },
  locationIndicator: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationIndicatorText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  captureContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 30,
  },
  flipButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  instructions: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  instructionText: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  locationOverlay: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationOverlayText: {
    color: "#6366f1",
    marginLeft: 8,
    fontFamily: "monospace",
    fontSize: 12,
  },
  previewActions: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    borderRadius: 12,
  },
  retakeButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonLoading: {
    backgroundColor: "#6b7280",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#22c55e",
    marginTop: 20,
  },
  successText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },
  proofDetails: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  proofDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  proofDetailText: {
    color: "#6366f1",
    marginLeft: 10,
    fontFamily: "monospace",
  },
  newProofButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newProofButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
