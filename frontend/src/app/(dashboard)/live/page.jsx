'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '../../../components/layout/Header';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Wifi, WifiOff, Volume2, VolumeX,
  Pause, Play, Trash2, AlertTriangle, ShieldAlert,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../../api-integration/subscriptions';

export default function LiveFeedPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0 });
  const eventSourceRef = useRef(null);
  const router = useRouter();

  const { token, user } = useAuth();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: subscriptionApi.getMySubscription
  });

  const isPro = subscription?.plan === 'Pro' || subscription?.plan === 'Enterprise';

  // Connect to SSE
  useEffect(() => {
    if (!token || !isPro) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const analyticsUrl = process.env.VITE_API_URL_ANALYTICS || process.env.NEXT_PUBLIC_API_URL_ANALYTICS || 'http://localhost:3003';
      const url = `${analyticsUrl}/events/anomalies?token=${token}`;
      const es = new EventSource(url);

      es.onopen = () => {
        setIsConnected(true);
        toast.success('Live Feed Connected');
      };

      es.onerror = () => {
        setIsConnected(false);
      };

      es.onmessage = (event) => {
        if (isPaused) return;

        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'anomaly') {
            const data = parsed.data;

            setStats(prev => ({
              total: prev.total + 1,
              critical: prev.critical + (data.severity === 'CRITICAL' ? 1 : 0),
              high: prev.high + (data.severity === 'HIGH' ? 1 : 0)
            }));

            setAnomalies(prev => [data, ...prev].slice(0, 50));

            if (soundEnabled && (data.severity === 'CRITICAL' || data.severity === 'HIGH')) {
              if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioCtx();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(data.severity === 'CRITICAL' ? 880 : 440, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing anomaly event', e);
        }
      };

      eventSourceRef.current = es;
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [token, isPaused, soundEnabled, isPro]);

  if (subLoading) {
    return <div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">Loading Live Ops Center...</div>;
  }

  if (!isPro) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8 text-center">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-lg mx-auto bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
            <Zap className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Live Ops Center
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20">
              PRO FEATURE
            </span>
          </div>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Upgrade to <span className="text-indigo-400 font-semibold">Anomalyze Pro</span> to unlock real-time anomaly detection, live transaction streaming, and millisecond-latency alerts.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-xs text-gray-400">Real-time Stream</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <ShieldAlert className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-xs text-gray-400">Instant Alerts</div>
            </div>
          </div>

          <button
            onClick={() => router.push('/settings')}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  const clearFeed = () => {
    setAnomalies([]);
    setStats({ total: 0, critical: 0, high: 0 });
    toast.info('Feed cleared');
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <Header title="Live Ops Center" />

      {/* Control Bar */}
      <div className="sticky top-4 z-40 bg-card/80 backdrop-blur-md border border-border/50 p-3 md:p-4 rounded-2xl shadow-lg mb-6 flex flex-wrap items-center justify-between gap-3 md:gap-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
            isConnected
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          )}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Live Stream Active' : 'Disconnected'}
          </div>
          {isConnected && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          )}
        </div>

        {/* Stats Counters */}
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-[10px] md:text-xs text-muted-foreground uppercase font-medium">Total</span>
            <span className="font-mono text-base md:text-lg font-bold text-foreground">{stats.total}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] md:text-xs text-red-400 uppercase font-medium">Critical</span>
            <span className="font-mono text-base md:text-lg font-bold text-red-400">{stats.critical}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] md:text-xs text-orange-400 uppercase font-medium">High</span>
            <span className="font-mono text-base md:text-lg font-bold text-orange-400">{stats.high}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "p-2 rounded-xl border transition-colors",
              soundEnabled
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted"
            )}
            title={soundEnabled ? 'Mute Alert Sounds' : 'Unmute Alert Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors",
              isPaused
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={clearFeed}
            className="p-2 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
            title="Clear Feed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Anomaly Feed Stream */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {anomalies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-muted-foreground/40 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Awaiting Real-Time Anomalies</h3>
              <p className="text-sm max-w-sm">
                Incoming flagged events from the detection engine will appear here in sub-second latency.
              </p>
            </motion.div>
          ) : (
            anomalies.map((item, idx) => (
              <motion.div
                key={item.id || item.txId || idx}
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "p-4 rounded-2xl border transition-all glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                  item.severity === 'CRITICAL' && "border-red-500/30 bg-red-500/[0.03]",
                  item.severity === 'HIGH' && "border-orange-500/30 bg-orange-500/[0.03]",
                  item.severity === 'MEDIUM' && "border-yellow-500/30 bg-yellow-500/[0.03]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl border mt-0.5",
                    item.severity === 'CRITICAL' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                      item.severity === 'HIGH' ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                        "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        item.severity === 'CRITICAL' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                          item.severity === 'HIGH' ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
                            "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      )}>
                        {item.severity}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground font-semibold">
                        {item.txId || item.id}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">{item.explanation || 'Anomaly detected'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>Merchant: <strong className="text-foreground">{item.merchant || 'N/A'}</strong></span>
                      <span>Amount: <strong className="text-foreground">${item.amount || '0.00'}</strong></span>
                      {item.location && <span>Location: <strong className="text-foreground">{item.location}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-center text-xs text-muted-foreground whitespace-nowrap self-end">
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now'}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
