'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BarChart3, ShieldCheck, Zap, AlertTriangle, Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Simulated anomaly detection data
const generateDataPoints = () => {
  const points = [];
  for (let i = 0; i < 24; i++) {
    const isAnomaly = i === 7 || i === 18;
    const baseValue = 40 + Math.random() * 30;
    points.push({
      hour: i,
      value: isAnomaly ? baseValue + 40 + Math.random() * 20 : baseValue,
      isAnomaly
    });
  }
  return points;
};

const AnimatedChart = () => {
  const [data] = useState(generateDataPoints());
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full h-full p-6 flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transaction Volume</h3>
          <p className="text-sm text-muted-foreground">Last 24 hours • Real-time monitoring</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-muted-foreground">Anomaly</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex items-end gap-1 px-2">
        {data.map((point, index) => (
          <motion.div
            key={index}
            className="flex-1 flex flex-col items-center gap-1"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
          >
            <motion.div
              className={`w-full rounded-t-sm relative group cursor-pointer ${point.isAnomaly
                ? 'bg-gradient-to-t from-red-600 to-red-400'
                : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                }`}
              style={{ height: `${(point.value / maxValue) * 180}px` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.1 }}
            >
              {point.isAnomaly && (
                <motion.div
                  className="absolute -top-6 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </motion.div>
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap z-10">
                <div className="font-medium">{point.hour}:00</div>
                <div className={point.isAnomaly ? 'text-red-400' : 'text-cyan-400'}>
                  {Math.round(point.value)} transactions
                </div>
                {point.isAnomaly && (
                  <div className="text-red-400 font-medium">⚠ Anomaly Detected</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-2 mt-2 text-xs text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">1,247</div>
          <div className="text-xs text-muted-foreground">Total Transactions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">2</div>
          <div className="text-xs text-muted-foreground">Anomalies Detected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">99.8%</div>
          <div className="text-xs text-muted-foreground">System Accuracy</div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleTryNow = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/anomalyze-logo.svg" alt="Anomalyze Logo" className="h-8 w-8" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
                Anomalyze
              </span>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </a>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-xl hover:bg-muted transition-colors group"
                aria-label="Toggle theme"
              >
                <div className="relative h-5 w-5">
                  <Sun className={`absolute inset-0 h-5 w-5 text-yellow-500 transition-all ${theme === 'dark' ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
                  <Moon className={`absolute inset-0 h-5 w-5 text-indigo-400 transition-all ${theme === 'dark' ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
                </div>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 rounded-full border border-border hover:bg-muted transition-all text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleTryNow}
                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#features" onClick={() => setMobileNavOpen(false)} className="block text-sm font-medium hover:text-primary transition-colors py-2">
                  Features
                </a>
                <a href="#about" onClick={() => setMobileNavOpen(false)} className="block text-sm font-medium hover:text-primary transition-colors py-2">
                  About
                </a>
                <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                  <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Toggle theme">
                    <div className="relative h-5 w-5">
                      <Sun className={`absolute inset-0 h-5 w-5 text-yellow-500 transition-all ${theme === 'dark' ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
                      <Moon className={`absolute inset-0 h-5 w-5 text-indigo-400 transition-all ${theme === 'dark' ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
                    </div>
                  </button>
                  {isAuthenticated ? (
                    <button onClick={() => { router.push('/dashboard'); setMobileNavOpen(false); }} className="flex-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium text-center">
                      Dashboard
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { router.push('/login'); setMobileNavOpen(false); }} className="flex-1 px-4 py-2 rounded-full border border-border text-sm font-medium text-center">
                        Sign In
                      </button>
                      <button onClick={() => { handleTryNow(); setMobileNavOpen(false); }} className="flex-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium text-center">
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-24 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-1/2 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              Detect Anomalies with <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
                AI Precision
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Uncover hidden patterns and safeguard your data with our advanced anomaly detection platform. Simple, fast, and secure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleTryNow}
                className="group px-8 py-4 rounded-full bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 flex items-center gap-2"
              >
                Try Anomalyze Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="px-8 py-4 rounded-full border border-border hover:bg-muted transition-all text-lg font-medium"
              >
                Learn More
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden" style={{ minHeight: '250px' }}>
              <AnimatedChart />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur opacity-20 -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose Anomalyze?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for developers and data scientists who need reliable, real-time insights without the complexity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                title: "Real-time Detection",
                desc: "Instantly identify outliers as data streams in, enabling immediate response."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
                title: "Enterprise Security",
                desc: "Your data is encrypted and protected with industry-standard security protocols."
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
                title: "Visual Analytics",
                desc: "Understand your data with intuitive, interactive charts and customizable dashboards."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="mb-6 p-4 rounded-xl bg-background w-fit border border-border">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Anomalyze. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
