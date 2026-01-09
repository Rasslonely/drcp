"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  /** Label to display */
  label: string;
  /** Link href - if not provided, this is the current page (last item) */
  href?: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Additional className */
  className?: string;
}

/**
 * Breadcrumb navigation component.
 * 
 * Usage:
 * ```tsx
 * <Breadcrumb items={[
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Governance", href: "/governance" },
 *   { label: "Create Proposal" },  // current page (no href)
 * ]} />
 * ```
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm overflow-x-auto no-scrollbar whitespace-nowrap pb-1", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.label} className="flex items-center">
            {/* Separator (except for first item) */}
            {!isFirst && (
              <ChevronRight className="h-4 w-4 mx-1 text-gray-600 flex-shrink-0" />
            )}

            {/* Breadcrumb item */}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                {isFirst && <Home className="h-3.5 w-3.5 mr-1" />}
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center",
                  isLast ? "text-white font-medium" : "text-gray-400"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
