"use client";

import { motion } from "framer-motion";
import { DollarSign, FileText, Trophy, BarChart3, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =============================================================================
// ACTION BUTTON
// =============================================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  color: string;
  index: number;
}

function ActionButton({
  icon,
  title,
  description,
  href,
  onClick,
  color,
  index,
}: ActionButtonProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card 
        className="cursor-pointer border-white/10 hover:border-white/20 transition-all h-full"
        variant="glass"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-xl", color)}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            </div>
            {href && (
              <ExternalLink className="h-4 w-4 text-gray-500 mt-1" />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="h-full block">{content}</Link>;
  }

  return <div onClick={onClick} className="h-full">{content}</div>;
}

// =============================================================================
// QUICK ACTIONS COMPONENT
// =============================================================================

export function QuickActions() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const handleDonateClick = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
    // If connected, the QuickDonate component on the page will handle it
    // Or we could open a modal here
  };

  const actions: Omit<ActionButtonProps, "index">[] = [
    {
      icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
      title: "Make a Donation",
      description: "Support disaster relief efforts",
      onClick: handleDonateClick,
      color: "bg-emerald-500/20",
    },
    {
      icon: <FileText className="h-5 w-5 text-blue-400" />,
      title: "Create Proposal",
      description: "Submit a governance proposal",
      href: "/governance",
      color: "bg-blue-500/20",
    },
    {
      icon: <Trophy className="h-5 w-5 text-yellow-400" />,
      title: "View Leaderboard",
      description: "See top volunteers & donors",
      href: "/reputation",
      color: "bg-yellow-500/20",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
      title: "Transparency Report",
      description: "View all on-chain transactions",
      href: "/transparency",
      color: "bg-purple-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <ActionButton key={action.title} {...action} index={index} />
        ))}
      </div>
    </div>
  );
}
