"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

interface PageHeaderProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Icon color class, e.g. "text-indigo-400" */
  iconColor?: string;
  /** Icon background color class, e.g. "bg-indigo-500/20" */
  iconBg?: string;
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Breadcrumb navigation items */
  breadcrumb?: BreadcrumbItem[];
  /** Optional children to render after title (e.g., loading spinner) */
  children?: React.ReactNode;
  /** Optional centered content below the header (e.g., badges, status) */
  centerContent?: React.ReactNode;
  /** Optional additional actions below centerContent (e.g., CTAs) */
  actions?: React.ReactNode;
  /** Additional className for the section */
  className?: string;
}

/**
 * Standardized page header component with breadcrumb navigation.
 * 
 * Features:
 * - Breadcrumb navigation (replaces back buttons)
 * - Left-aligned title for consistency
 * - Optional centered content area for special elements
 * 
 * Usage:
 * ```tsx
 * <PageHeader
 *   breadcrumb={[
 *     { label: "Dashboard", href: "/dashboard" },
 *     { label: "Transparency" },
 *   ]}
 *   icon={Eye}
 *   title="Transparency Report"
 *   subtitle="Track every donation on-chain"
 *   centerContent={<VerificationBadge />}
 * />
 * ```
 */
export function PageHeader({
  icon: Icon,
  iconColor = "text-indigo-400",
  iconBg = "bg-indigo-500/20",
  title,
  subtitle,
  breadcrumb,
  children,
  centerContent,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("py-6 space-y-4", className)}
    >
      {/* Breadcrumb Navigation */}
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}

      {/* Title Row - Always Left Aligned */}
      <div className="flex items-center space-x-3">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0",
          iconBg
        )}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-white truncate">{title}</h1>
            {children}
          </div>
          {/* Subtitle - Left aligned */}
          {subtitle && (
            <p className="text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Centered Content Area (optional) */}
      {centerContent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-3 pt-2"
        >
          {centerContent}
        </motion.div>
      )}

      {/* Actions (optional) */}
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3"
        >
          {actions}
        </motion.div>
      )}
    </motion.section>
  );
}
