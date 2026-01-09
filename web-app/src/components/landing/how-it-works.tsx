"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DollarSign, Cpu, Send, BarChart3, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: 1,
    icon: DollarSign,
    title: "Donate",
    description: "Choose an amount and donate via crypto wallet. Funds go directly to smart contract vault.",
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    step: 2,
    icon: Cpu,
    title: "AI Monitors",
    description: "Our AI system monitors real-time disaster data from BMKG, GDACS, and USGS.",
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    step: 3,
    icon: Send,
    title: "Funds Released",
    description: "When disaster strikes, smart contracts automatically release funds to verified relief efforts.",
    color: "from-purple-400 to-purple-600",
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
  {
    step: 4,
    icon: BarChart3,
    title: "Track Impact",
    description: "Every transaction is on-chain. See exactly where your donation went and who it helped.",
    color: "from-orange-400 to-orange-600",
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-24 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From donation to impact — fully automated, fully transparent
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line (desktop) */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-white/20 to-transparent z-0" />
              )}

              {/* Step Card */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Step Number */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`w-24 h-24 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6 border border-white/10`}
                >
                  <step.icon className={`h-10 w-10 ${step.iconColor}`} />
                </motion.div>

                {/* Step Number Badge */}
                <div className={`absolute -top-2 -right-2 md:right-auto md:left-1/2 md:translate-x-8 w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {step.step}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Mobile Arrow */}
              {index < STEPS.length - 1 && (
                <div className="flex justify-center my-4 md:hidden">
                  <ArrowRight className="h-6 w-6 text-white/20 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
