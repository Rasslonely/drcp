"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, Menu, X, LayoutDashboard, Eye, Vote, Award, AlertTriangle, Coffee } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/emergencies", label: "Emergencies", icon: AlertTriangle },
  { href: "/transparency", label: "Transparency", icon: Eye },
  { href: "/governance", label: "Governance", icon: Vote },
  { href: "/reputation", label: "Reputation", icon: Award },
  { href: "/support", label: "Support", icon: Coffee, highlight: true },
];

// =============================================================================
// SCROLL DIRECTION HOOK
// =============================================================================

function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY;
    const threshold = 10; // Minimum scroll to trigger direction change

    // Check if at top
    setIsAtTop(scrollY < 50);

    // Determine direction
    if (Math.abs(scrollY - lastScrollY.current) > threshold) {
      const newDirection = scrollY > lastScrollY.current ? "down" : "up";
      setScrollDirection(newDirection);
      lastScrollY.current = scrollY;
    }

    ticking.current = false;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateScrollDirection]);

  return { scrollDirection, isAtTop };
}

// =============================================================================
// HEADER COMPONENT
// =============================================================================

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { scrollDirection, isAtTop } = useScrollDirection();

  // Navbar visibility: show when scrolling up OR at top
  const isNavbarVisible = scrollDirection !== "down" || isAtTop;

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.header 
        initial={{ y: 0 }}
        animate={{ 
          y: isNavbarVisible ? 0 : -100,
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
        className={`fixed top-0 left-0 right-0 z-50 w-full border-b transition-all duration-300 ${
          isAtTop 
            ? "border-white/5 bg-gray-950/60" 
            : "border-white/10 bg-gray-950/80 shadow-lg shadow-black/20"
        } backdrop-blur-xl`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo - Fixed width to balance with wallet section */}
          <div className="w-[120px] lg:w-[200px] flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center">
                <img src="/DRCP_logo.png" alt="" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:inline">DRCP</span>
            </Link>
          </div>

          {/* Desktop Navigation - True center */}
          <nav className="hidden md:flex flex-1 items-center justify-center space-x-4 lg:space-x-6 mx-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    link.highlight
                      ? isActive
                        ? "text-amber-400"
                        : "text-amber-400/70 hover:text-amber-400"
                      : isActive
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                  }`}
                >
                  {link.highlight && <Coffee className="h-3.5 w-3.5" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Connect + Mobile Menu Button - Fixed width to balance with logo */}
          <div className="w-[120px] lg:w-[200px] flex-shrink-0 flex items-center justify-end space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {!connected ? (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
                        >
                          Connect Wallet
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={openChainModal}
                            className="flex items-center space-x-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                className="h-4 w-4"
                              />
                            )}
                            <span className="hidden lg:inline">{chain.name}</span>
                          </button>
                          <button
                            onClick={openAccountModal}
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                          >
                            {account.displayName}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              onClick={toggleMobileMenu}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Sidebar Overlay & Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={closeMobileMenu}
            />

            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-[70] h-full w-[280px] md:hidden"
            >
              {/* Gradient Glow Edge */}
              <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />
              
              {/* Glassmorphic Background */}
              <div className="h-full w-full bg-gray-950/80 backdrop-blur-2xl border-l border-white/10">
                {/* Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center">
                      <img src="/DRCP_logo.png" alt="DRCP" className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-bold text-white">Menu</span>
                  </div>
                  <motion.button
                    onClick={closeMobileMenu}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-2">
                  {navLinks.map((link, index) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          onClick={closeMobileMenu}
                          className={`flex items-center space-x-3 py-3 px-4 rounded-xl font-medium transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : ""}`} />
                          <span>{link.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="ml-auto h-2 w-2 rounded-full bg-indigo-400"
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Wallet Connect Section (Mobile) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-gray-950/50">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        mounted,
                      }) => {
                        const ready = mounted;
                        const connected = ready && account && chain;

                        return (
                          <div
                            {...(!ready && {
                              "aria-hidden": true,
                              style: {
                                opacity: 0,
                                pointerEvents: "none",
                                userSelect: "none",
                              },
                            })}
                          >
                            {!connected ? (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-medium text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
                              >
                                Connect Wallet
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  onClick={openChainModal}
                                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white hover:bg-white/20"
                                >
                                  {chain.hasIcon && chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? "Chain icon"}
                                      src={chain.iconUrl}
                                      className="h-4 w-4"
                                    />
                                  )}
                                  <span>{chain.name}</span>
                                </button>
                                <button
                                  onClick={openAccountModal}
                                  className="w-full rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 px-3 py-2.5 text-sm text-white hover:from-indigo-500/30 hover:to-purple-500/30"
                                >
                                  {account.displayName}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    </ConnectButton.Custom>
                  </motion.div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
