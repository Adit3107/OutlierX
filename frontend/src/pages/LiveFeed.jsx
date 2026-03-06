import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Wifi, WifiOff, Volume2, VolumeX,
  Pause, Play, Trash2, AlertTriangle, ShieldAlert,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../api-integration/subscriptions';

// Simple beep sound (base64) for critical alerts
const ALERT_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, will replace with real sound logic or use browser API

export default function LiveFeed() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0 });
  const eventSourceRef = useRef(null);
  // Check for Pro Plan
  const { token, user } = useAuth();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: subscriptionApi.getMySubscription
  });

  const isPro = subscription?.plan === 'Pro' || subscription?.plan === 'Enterprise';

  // Connect to SSE
  useEffect(() => {
    if (!token) return;
    if (!isPro) return; // Don't connect if not Pro

    const connect = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `${import.meta.env.VITE_API_URL_ANALYTICS || 'http://localhost:3003'}/events/anomalies?token=${token}`;
      const es = new EventSource(url);

      es.onopen = () => {
        setIsConnected(true);
        toast.success('Live Feed Connected');
      };

      es.onerror = (err) => {
        setIsConnected(false);
      };

      es.onmessage = (event) => {
        if (isPaused) return;

        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'anomaly') {
            const data = parsed.data;
            // console.log('⚡️ Live Anomaly:', data);

            // Update Stats
            setStats(prev => ({
              total: prev.total + 1,
              critical: prev.critical + (data.severity === 'CRITICAL' ? 1 : 0),
              high: prev.high + (data.severity === 'HIGH' ? 1 : 0)
            }));

            // Add to list (limit to 50 items)
            setAnomalies(prev => [data, ...prev].slice(0, 50));

            // Play Sound
            if (soundEnabled && (data.severity === 'CRITICAL' || data.severity === 'HIGH')) {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
  }, [token, isPaused, soundEnabled, isPro]); // Re-connect if token/plan changes.

  const navigate = useNavigate();

  if (subLoading) {
    return <div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">Loading Live Ops Center...</div>;
  }

  if (!isPro) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8 text-center">
        {/* Background Elements */}
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
            onClick={() => navigate('/settings')}
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
          <div className="w-px h-6 md:h-8 bg-border/50" />
          <div className="flex flex-col items-center text-red-500">
            <span className="text-[10px] md:text-xs opacity-80 uppercase font-medium">Critical</span>
            <span className="font-mono text-base md:text-lg font-bold">{stats.critical}</span>
          </div>
          <div className="w-px h-6 md:h-8 bg-border/50" />
          <div className="flex flex-col items-center text-orange-500">
            <span className="text-[10px] md:text-xs opacity-80 uppercase font-medium">High</span>
            <span className="font-mono text-base md:text-lg font-bold">{stats.high}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              soundEnabled ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            title={soundEnabled ? "Mute Alerts" : "Enable Alerts"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "p-2 rounded-xl transition-colors border",
              isPaused
                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"
                : "bg-muted/50 text-foreground border-border/50 hover:bg-muted"
            )}
            title={isPaused ? "Resume Feed" : "Pause Feed"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>

          <button
            onClick={clearFeed}
            className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear Feed"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3 relative min-h-[500px]">
        {anomalies.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Waiting for anomalies...</p>
            <p className="text-sm">Start the simulator to see live events</p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {anomalies.map((item) => (
              <motion.div
                key={item.id || Math.random()} // Fallback key if ID missing
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                layout
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:shadow-md",
                  "bg-card/50 backdrop-blur-sm",
                  item.severity === 'CRITICAL' ? "border-red-500/50 shadow-red-500/5" :
                    item.severity === 'HIGH' ? "border-orange-500/50 shadow-orange-500/5" :
                      "border-border/50"
                )}
              >
                {/* Severity Stripe */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  item.severity === 'CRITICAL' ? "bg-red-500" :
                    item.severity === 'HIGH' ? "bg-orange-500" :
                      item.severity === 'MEDIUM' ? "bg-yellow-500" : "bg-green-500"
                )} />

                <div className="flex items-start justify-between gap-4 pl-3">
                  {/* Left: Icon & Main Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "p-2.5 rounded-lg shrink-0",
                      item.severity === 'CRITICAL' ? "bg-red-500/10 text-red-500" :
                        item.severity === 'HIGH' ? "bg-orange-500/10 text-orange-500" :
                          "bg-muted text-muted-foreground"
                    )}>
                      {item.severity === 'CRITICAL' ? <ShieldAlert className="w-6 h-6" /> :
                        item.severity === 'HIGH' ? <Zap className="w-6 h-6" /> :
                          <AlertTriangle className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-base">
                          {item.merchant || 'Unknown Merchant'}
                        </h3>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          item.severity === 'CRITICAL' ? "bg-red-500 text-white shadow-sm shadow-red-500/50" :
                            item.severity === 'HIGH' ? "bg-orange-500/20 text-orange-500 border border-orange-500/20" :
                              "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
                        )}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.explanation || 'Anomaly detected based on transaction pattern.'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground/80 font-mono mt-1">
                        <span className="bg-muted/50 px-1.5 py-0.5 rounded">ID: {item.displayId}</span>
                        <span>User: {item.userId || 'Me'}</span>
                        <span>Time: {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Score */}
                  <div className="flex flex-col items-end gap-1 text-right shrink-0">
                    <span className="text-lg font-bold text-foreground tabular-nums">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold",
                        item.score > 0.8 ? "text-red-500" : "text-yellow-500"
                      )}>
                        Score: {Math.round(item.score * 100)}%
                      </span>
                      {/* Mini Confidence Bar */}
                      <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.score > 0.9 ? "bg-red-500" :
                              item.score > 0.7 ? "bg-orange-400" : "bg-yellow-400"
                          )}
                          style={{ width: `${item.score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
