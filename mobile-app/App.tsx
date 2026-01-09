import "@walletconnect/react-native-compat";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from "wagmi";
import { config } from './src/config/wagmi';

import VictimDistressScreen from "./src/screens/VictimDistressScreen";
import VolunteerTasksScreen from "./src/screens/VolunteerTasksScreen";
import ProofCaptureScreen from "./src/screens/ProofCaptureScreen";
import ReputationScreen from "./src/screens/ReputationScreen";

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <View style={styles.container}>
          <StatusBar style="light" />
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: "#6366f1",
                background: "#030712",
                card: "#111827",
                text: "#fff",
                border: "rgba(255,255,255,0.1)",
                notification: "#ef4444",
              },
              fonts: {
                regular: { fontFamily: "System", fontWeight: "400" },
                medium: { fontFamily: "System", fontWeight: "500" },
                bold: { fontFamily: "System", fontWeight: "600" },
                heavy: { fontFamily: "System", fontWeight: "700" },
              },
            } as any}
          >
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: "#111827",
                  borderTopColor: "rgba(255,255,255,0.1)",
                  paddingTop: 8,
                  paddingBottom: 8,
                  height: 70,
                },
                tabBarActiveTintColor: "#6366f1",
                tabBarInactiveTintColor: "#6b7280",
                tabBarLabelStyle: {
                  fontSize: 11,
                  fontWeight: "600",
                },
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName = "help-circle";
    
                  if (route.name === "SOS") {
                    iconName = focused ? "alert-circle" : "alert-circle-outline";
                  } else if (route.name === "Tasks") {
                    iconName = focused ? "list" : "list-outline";
                  } else if (route.name === "Proof") {
                    iconName = focused ? "camera" : "camera-outline";
                  } else if (route.name === "Reputation") {
                    iconName = focused ? "trophy" : "trophy-outline";
                  }
    
                  return <Ionicons name={iconName as any} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen
                name="SOS"
                component={VictimDistressScreen}
                options={{
                  tabBarLabel: "Distress",
                }}
              />
              <Tab.Screen
                name="Tasks"
                component={VolunteerTasksScreen}
                options={{
                  tabBarLabel: "Tasks",
                  tabBarBadge: 4,
                }}
              />
              <Tab.Screen
                name="Proof"
                component={ProofCaptureScreen}
                options={{
                  tabBarLabel: "Capture",
                }}
              />
              <Tab.Screen
                name="Reputation"
                component={ReputationScreen}
                options={{
                  tabBarLabel: "Reputation",
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </View>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
});
