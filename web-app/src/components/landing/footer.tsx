"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Github, Twitter, ExternalLink, Heart, AlertTriangle } from "lucide-react";
import { getExplorerUrl, getChainName, getShortChainName } from "@/lib/chain-utils";

const NAVIGATION_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Transparency", href: "/transparency" },
  { label: "Governance", href: "/governance" },
  { label: "Reputation", href: "/reputation" },
];

const RESOURCE_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Documentation", href: "#" },
  { label: "Contact", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
      {/* Unaudited Beta Warning Banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>
              <strong>Beta Software:</strong> Smart contracts are currently unaudited. 
              Use at your own risk. <Link href="/terms" className="underline hover:text-yellow-300">Read Terms</Link>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 flex items-center justify-center">
                <img src="/DRCP_logo.png" alt="" />
              </div>
              <span className="font-bold text-xl text-white">DRCP</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Disaster Response Coordination Protocol. Transparent disaster relief powered by blockchain and AI.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-3">
              {NAVIGATION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-semibold text-white mb-4">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {[getShortChainName(), "Next.js", "Solidity", "OpenZeppelin"].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-gray-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm">
              © {currentYear} DRCP. Open source and free to use.
            </p>

            {/* Network Badge */}
            <div className="flex items-center gap-4">
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm hover:bg-purple-500/20 transition-colors"
              >
                <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                {getChainName()}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Made with love */}
            <p className="flex items-center gap-1 text-gray-500 text-sm">
              Made with <Heart className="h-4 w-4 text-red-400" /> for Indonesia
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

