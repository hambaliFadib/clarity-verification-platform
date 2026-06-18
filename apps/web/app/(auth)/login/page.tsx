"use client";

import { getProviders, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/projects";

  useEffect(() => {
    getProviders()
      .then((providers) => setHasGoogleProvider(Boolean(providers?.google)))
      .catch(() => setHasGoogleProvider(false));
  }, []);

  const handleGoogleLogin = async () => {
    if (!hasGoogleProvider) return;
    setIsLoadingGoogle(true);
    await signIn("google", { callbackUrl });
  };

  const handleGuestLogin = async () => {
    setIsLoadingGuest(true);
    await signIn("guest", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-fixed-dim/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-tertiary-fixed-dim/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-outline-variant/60 rounded-3xl p-10 shadow-elevated relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-6 shadow-subtle hover-lift">
          <Shield className="h-8 w-8 text-on-primary-container" />
        </div>

        <h1 className="text-display-sm font-headline font-bold text-on-surface mb-2 text-center">
          Clarity Platform
        </h1>
        <p className="text-body-md text-on-surface-variant text-center mb-10">
          Sign in to access your QA workspace
        </p>

        <div className="w-full space-y-4">
          <Button
            variant="default"
            className="w-full py-6 text-label-lg rounded-xl flex items-center justify-center gap-3 bg-white text-on-surface border border-outline-variant hover:bg-surface-container-low transition-all shadow-sm"
            onClick={handleGoogleLogin}
            disabled={!hasGoogleProvider || isLoadingGoogle || isLoadingGuest}
          >
            {isLoadingGoogle ? (
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {hasGoogleProvider ? "Continue with Google" : "Google OAuth not configured"}
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-outline-variant/60"></div>
            <span className="flex-shrink-0 mx-4 text-label-sm text-outline uppercase tracking-wider font-bold">Or</span>
            <div className="flex-grow border-t border-outline-variant/60"></div>
          </div>

          <Button
            variant="outline"
            className="w-full py-6 text-label-lg rounded-xl"
            onClick={handleGuestLogin}
            disabled={isLoadingGoogle || isLoadingGuest}
          >
            {isLoadingGuest ? (
              <span className="w-5 h-5 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
            ) : (
              "Continue as Guest"
            )}
          </Button>
        </div>
      </div>

      <p className="absolute bottom-6 text-body-sm text-outline text-center w-full">
        &copy; {new Date().getFullYear()} NexQA. All rights reserved.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
