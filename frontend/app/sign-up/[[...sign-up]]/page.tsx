import { SignUp } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-surface text-primary shadow-lg shadow-primary/10">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none tracking-tight">OutlierX</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Fraud Ops Console</p>
          </div>
        </div>

        <SignUp 
          appearance={{
            elements: {
              card: "bg-surface border border-border shadow-xl rounded-xl",
              headerTitle: "text-foreground font-display font-bold",
              headerSubtitle: "text-muted-foreground text-xs",
              socialButtonsBlockButton: "bg-surface-alt border border-border text-foreground hover:bg-surface hover:text-foreground",
              formButtonPrimary: "bg-primary-strong hover:bg-primary-strong/90 text-primary-foreground font-medium",
              formFieldLabel: "text-foreground/80 font-medium",
              formFieldInput: "bg-surface-alt border border-border text-foreground focus:ring-primary focus:border-primary",
              footerActionLink: "text-primary hover:text-primary-strong",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
            }
          }}
        />
      </div>
    </div>
  );
}
