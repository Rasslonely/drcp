"use client";

import { AlertTriangle } from "lucide-react";
import { ActiveEmergencies } from "@/components/emergency-card";
import { PageHeader } from "@/components/ui/page-header";
import { ActiveCampaignsSection } from "@/components/campaigns";

export default function EmergenciesPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header with Breadcrumb */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Emergencies" },
        ]}
        icon={AlertTriangle}
        iconColor="text-orange-500"
        iconBg="bg-orange-500/20"
        title="Disaster Monitoring Center"
        subtitle="Real-time disaster data from BMKG, GDACS, and USGS"
      />

      {/* Active Campaigns Section */}
      <ActiveCampaignsSection maxCampaigns={3} />

      {/* Divider when campaigns exist */}
      <div className="border-t border-white/10" />

      {/* Full ActiveEmergencies with all filters */}
      <ActiveEmergencies />
    </div>
  );
}
