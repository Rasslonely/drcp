"use client";

import {
  HeroSection,
  HowItWorks,
  EmergencyPreview,
  GlobalStats,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Full viewport */}
      <HeroSection />

      {/* How It Works - 4 step explanation */}
      <HowItWorks />

      {/* Active Emergencies Preview - Real-time data */}
      <EmergencyPreview />

      {/* Global Impact Stats - On-chain metrics */}
      <GlobalStats />

      {/* Footer */}
      <Footer />
    </div>
  );
}
