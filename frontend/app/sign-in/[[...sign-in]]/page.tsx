import { SignIn } from '@clerk/nextjs';
import { Activity } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none z-0" />
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full filter blur-[120px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none tracking-tight text-foreground">Anomalyze</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">AI Fraud Detection Platform</p>
          </div>
        </div>

        <SignIn
          appearance={{
            elements: {
              card: 'bg-surface border border-border shadow-xl rounded-xl',
              headerTitle: 'text-foreground font-display font-bold',
              headerSubtitle: 'text-muted-foreground text-xs',
              socialButtonsBlockButton: 'bg-surface-alt border border-border text-foreground hover:bg-surface hover:text-foreground',
              formButtonPrimary: 'bg-primary hover:bg-primary-strong text-primary-foreground font-semibold',
            },
          }}
        />
      </div>
    </div>
  );
}
