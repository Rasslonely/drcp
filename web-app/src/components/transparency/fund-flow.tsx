"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFundFlow } from "@/hooks";

// Animated flowing particle component
function FlowingParticle({
  pathId,
  delay,
  duration,
  color,
}: {
  pathId: string;
  delay: number;
  duration: number;
  color: string;
}) {
  return (
    <motion.circle
      r="4"
      fill={color}
      filter="url(#glow)"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 1,
      }}
    >
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        fill="freeze"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </motion.circle>
  );
}

// Node component
function FlowNode({
  x,
  y,
  icon,
  label,
  value,
  color,
  index,
}: {
  x: number;
  y: number;
  icon: string;
  label: string;
  value: string;
  color: string;
  index: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.5, type: "spring" }}
    >
      {/* Background circle */}
      <circle
        cx={x}
        cy={y}
        r="32"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="2"
      />
      {/* Icon */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        className="select-none"
      >
        {icon}
      </text>
      {/* Label */}
      <text
        x={x}
        y={y + 45}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize="11"
        fontWeight="500"
      >
        {label}
      </text>
      {/* Value */}
      <text
        x={x}
        y={y + 60}
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="700"
      >
        {value}
      </text>
    </motion.g>
  );
}

export function FundFlow() {
  const { nodes, links, isLoading } = useFundFlow();

  // Node positions (horizontal layout - wider spacing)
  const positions = {
    donors: { x: 0, y: 125 },
    vault: { x: 250, y: 200 },
    treasury: { x: 250, y:50 },
    relief: { x: 500, y: 125 },
    volunteers: { x: 500, y: 275 },
  };

  // Find node data
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            💧 Fund Flow
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-500" />
            )}
          </span>
          <span className="text-sm text-gray-400 font-normal">
            Real-time on-chain data
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Responsive container - scrollable on mobile, centered on desktop */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="min-w-[520px] md:min-w-0 mx-auto" style={{ maxWidth: "700px" }}>
            <svg
              viewBox="-50 0 600 350"
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
              style={{ minHeight: "280px", maxHeight: "380px" }}
            >
            {/* Definitions */}
            <defs>
              {/* Glow filter for particles */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradients for links */}
              <linearGradient id="gradient-donors-vault" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
              <linearGradient id="gradient-donors-treasury" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
              <linearGradient id="gradient-vault-relief" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="gradient-vault-volunteers" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>

            {/* Donors -> Vault */}
            <motion.path
              id="path-donors-vault"
              d={`M ${positions.donors.x + 32} ${positions.donors.y} 
                  Q ${(positions.donors.x + positions.vault.x) / 2} ${positions.donors.y + 20} 
                  ${positions.vault.x - 32} ${positions.vault.y}`}
              fill="none"
              stroke="url(#gradient-donors-vault)"
              strokeWidth="3"
              strokeOpacity="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Donors -> Treasury */}
            <motion.path
                id="path-donors-treasury"
                d={`M ${positions.donors.x + 32} ${positions.donors.y - 10} 
                Q ${(positions.donors.x + positions.treasury.x) / 2} ${positions.treasury.y + 20} 
                ${positions.treasury.x - 32} ${positions.treasury.y}`}
                fill="none"
                stroke="url(#gradient-donors-treasury)"
                strokeWidth="2"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            />

            {/* Vault -> Relief */}
            <motion.path
              id="path-vault-relief"
              d={`M ${positions.vault.x + 32} ${positions.vault.y - 10} 
                  Q ${(positions.vault.x + positions.relief.x) / 2} ${positions.relief.y} 
                  ${positions.relief.x - 32} ${positions.relief.y}`}
              fill="none"
              stroke="url(#gradient-vault-relief)"
              strokeWidth="3"
              strokeOpacity="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />

            {/* Vault -> Volunteers */}
            <motion.path
              id="path-vault-volunteers"
              d={`M ${positions.vault.x + 32} ${positions.vault.y + 10} 
                  Q ${(positions.vault.x + positions.volunteers.x) / 2} ${positions.volunteers.y} 
                  ${positions.volunteers.x - 32} ${positions.volunteers.y}`}
              fill="none"
              stroke="url(#gradient-vault-volunteers)"
              strokeWidth="2"
              strokeOpacity="0.4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            />

            {/* Animated particles */}
            {!isLoading && (
              <>
                <FlowingParticle
                  pathId="path-donors-vault"
                  delay={0}
                  duration={2}
                  color="#10B981"
                />
                <FlowingParticle
                    pathId="path-donors-treasury"
                    delay={0.8}
                    duration={2.5}
                    color="#F472B6"
                />
                <FlowingParticle
                  pathId="path-vault-relief"
                  delay={0.5}
                  duration={2}
                  color="#6366F1"
                />
                <FlowingParticle
                  pathId="path-vault-volunteers"
                  delay={1}
                  duration={2.5}
                  color="#8B5CF6"
                />
              </>
            )}

            {/* Nodes */}
            {getNode("donors") && (
              <FlowNode
                x={positions.donors.x}
                y={positions.donors.y}
                icon={getNode("donors")!.icon}
                label={getNode("donors")!.label}
                value={getNode("donors")!.valueFormatted}
                color={getNode("donors")!.color}
                index={0}
              />
            )}

            {getNode("vault") && (
              <FlowNode
                x={positions.vault.x}
                y={positions.vault.y}
                icon={getNode("vault")!.icon}
                label={getNode("vault")!.label}
                value={getNode("vault")!.valueFormatted}
                color={getNode("vault")!.color}
                index={1}
              />
            )}

            {getNode("treasury") && (
                <FlowNode
                    x={positions.treasury.x}
                    y={positions.treasury.y}
                    icon={getNode("treasury")!.icon}
                    label={getNode("treasury")!.label}
                    value={getNode("treasury")!.valueFormatted}
                    color={getNode("treasury")!.color}
                    index={1.5}
                />
            )}

            {getNode("relief") && (
              <FlowNode
                x={positions.relief.x}
                y={positions.relief.y}
                icon={getNode("relief")!.icon}
                label={getNode("relief")!.label}
                value={getNode("relief")!.valueFormatted}
                color={getNode("relief")!.color}
                index={2}
              />
            )}

            {getNode("volunteers") && (
              <FlowNode
                x={positions.volunteers.x}
                y={positions.volunteers.y}
                icon={getNode("volunteers")!.icon}
                label={getNode("volunteers")!.label}
                value={getNode("volunteers")!.valueFormatted}
                color={getNode("volunteers")!.color}
                index={3}
              />
            )}

            {/* Loading overlay */}
            {isLoading && (
              <rect
                x="-50"
                y="0"
                width="600"
                height="520"
                fill="rgba(0,0,0,0.3)"
                rx="8"
              />
            )}
          </svg>
        </div>
      </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Donations</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Secured in Vault</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-pink-400" />
            <span>Sustainability Fund</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Relief Distribution</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Volunteer Payouts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
