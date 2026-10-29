/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Brain, Camera, FileText, BarChart2, ShieldAlert, Cpu, ArrowRight, Play, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onStartAsGuest: () => void;
  onOpenAuth: () => void;
  isDarkMode: boolean;
}

export default function LandingPage({ onStartAsGuest, onOpenAuth }: LandingPageProps) {
  const features = [
    {
      icon: <Camera className="w-6 h-6 text-blue-500" id="feature-icon-1" />,
      title: "Image Classification",
      desc: "Train models to recognize objects, facial expressions, or gestures using your files or live webcam stream."
    },
    {
      icon: <FileText className="w-6 h-6 text-purple-500" id="feature-icon-2" />,
      title: "Text Classification",
      desc: "Group articles, analyze sentiment, or identify languages with rapid natural language processing."
    },
    {
      icon: <Cpu className="w-6 h-6 text-emerald-500" id="feature-icon-3" />,
      title: "100% Client-Side Training",
      desc: "Powered by TensorFlow.js. Your datasets never leave your browser, ensuring absolute security and hardware acceleration."
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-orange-500" id="feature-icon-4" />,
      title: "Interactive Analytics",
      desc: "Dive into real-time loss/accuracy charts, customized confusion matrices, precision, recall, and F1 calculations."
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 font-sans relative z-10" id="landing-page-root">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center" id="hero-section">
        {/* Decorative Grid */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50 mb-6"
          id="hero-badge"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Next-Generation Browser Deep Learning</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl"
          id="hero-title"
        >
          Train AI models <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">directly in your browser</span>. No code.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed"
          id="hero-description"
        >
          Create, train, and test custom neural networks inside your browser with absolute privacy. Export production-ready TensorFlow models instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center w-full"
          id="hero-buttons-container"
        >
          <button
            onClick={onStartAsGuest}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-semibold shadow-lg shadow-slate-900/10 dark:shadow-white/5 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            id="btn-guest-mode"
          >
            Start Guest Training
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-800 rounded-2xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            id="btn-login"
          >
            Sign In / Register
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </button>
        </motion.div>
      </section>

      {/* Interactive Mockup Illustration */}
      <section className="px-6 pb-20 max-w-5xl mx-auto" id="landing-mockup-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="rounded-3xl shadow-2xl overflow-hidden frosted-glass p-3 md:p-6"
          id="interactive-mockup"
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4 mb-4" id="mockup-header">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="ml-2 text-xs font-mono text-slate-400">teachable_machine_pipeline.json</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/50 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              GPU Accelerated (WebGL)
            </div>
          </div>

          {/* Simple Animated Visual Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850" id="mockup-pipeline">
            
            {/* Step 1: Input */}
            <div className="flex flex-col p-4 rounded-xl frosted-glass-subtle shadow-sm">
              <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2">Step 1: Upload Data</div>
              <div className="text-sm font-semibold mb-3">Label A: Green Apple</div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="aspect-square bg-emerald-100 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center text-emerald-500 text-xs">🍏</div>
                <div className="aspect-square bg-emerald-100 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center text-emerald-500 text-xs">🍏</div>
                <div className="aspect-square bg-emerald-100 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center text-emerald-500 text-xs border border-dashed border-emerald-300">A2.jpg</div>
              </div>
              <div className="text-sm font-semibold mb-3">Label B: Orange Carrot</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square bg-orange-100 dark:bg-orange-950/60 rounded-lg flex items-center justify-center text-orange-500 text-xs">🥕</div>
                <div className="aspect-square bg-orange-100 dark:bg-orange-950/60 rounded-lg flex items-center justify-center text-orange-500 text-xs">🥕</div>
                <div className="aspect-square bg-orange-100 dark:bg-orange-950/60 rounded-lg flex items-center justify-center text-orange-500 text-xs border border-dashed border-orange-300">C1.jpg</div>
              </div>
            </div>

            {/* Step 2: Training */}
            <div className="flex flex-col p-4 rounded-xl frosted-glass-subtle shadow-sm justify-between">
              <div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2">Step 2: Training</div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Epoch 42/50</span>
                  <span className="text-blue-500">84%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden mb-4">
                  <div className="bg-blue-500 h-full w-[84%] animate-pulse" />
                </div>
              </div>

              <div className="py-2">
                <div className="text-xs text-slate-400 mb-1">Live Loss / Accuracy</div>
                <div className="h-16 flex items-end gap-1" id="mock-graph">
                  <div className="w-full bg-blue-400/20 rounded-t h-[60%] border-t border-blue-500" />
                  <div className="w-full bg-blue-400/25 rounded-t h-[45%] border-t border-blue-500" />
                  <div className="w-full bg-blue-400/30 rounded-t h-[35%] border-t border-blue-500" />
                  <div className="w-full bg-blue-400/40 rounded-t h-[20%] border-t border-blue-500" />
                  <div className="w-full bg-blue-400/50 rounded-t h-[12%] border-t border-blue-500 animate-bounce" />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Running TF.js pipeline...</span>
              </div>
            </div>

            {/* Step 3: Output */}
            <div className="flex flex-col p-4 rounded-xl frosted-glass-subtle shadow-sm justify-between">
              <div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-2">Step 3: Live Predict</div>
                <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-lg flex items-center justify-center text-slate-400 text-2xl border mb-3">
                  🍏
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Green Apple</span>
                  <span className="text-emerald-500">98.4%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-emerald-500 h-full w-[98.4%]" />
                </div>

                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Orange Carrot</span>
                  <span className="text-orange-500">1.6%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full w-[1.6%]" />
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-16 px-6 bg-white dark:bg-slate-900/30 border-y border-slate-200/80 dark:border-slate-850" id="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900 dark:text-white" id="features-title">Fully Packed ML Studio</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base md:text-lg">Everything you need to gather, categorize, optimize, validate, and launch real models directly in client runtime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="features-grid">
            {features.map((feat, idx) => (
              <div key={idx} className="p-6 frosted-glass rounded-2xl flex flex-col items-start hover:shadow-lg hover:scale-[1.02] transition-all duration-300" id={`feature-card-${idx}`}>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-5">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Privacy Callout */}
      <section className="py-16 px-6 max-w-7xl mx-auto" id="privacy-section">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-500/10" id="privacy-banner">
          {/* Decorative Vector Orb */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <div className="max-w-2xl relative z-10">
            <div className="p-3 bg-white/10 border border-white/20 rounded-xl inline-block mb-6">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">Zero Servers. Complete Privacy.</h3>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-6">
              We care about your data sovereignty. Traditional services require you to transmit photos, texts, or audio to their cloud containers. With our <strong>Teachable Machine</strong>, compilation, modeling, and analytics are performed safely inside your browser memory. No telemetry leakage, no hidden databases.
            </p>
            <button
              onClick={onStartAsGuest}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200 cursor-pointer shadow"
              id="btn-privacy-cta"
            >
              Train Off-line Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-850 py-8 px-6 text-center text-xs text-slate-500" id="landing-footer">
        <p>&copy; 2026 Teachable Machine Browser Studio. Made with Google TensorFlow.js & React.</p>
      </footer>

    </div>
  );
}
