import { useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "flowcheq_pwa_prompt_dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone || iosStandalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const isIOS = useMemo(
    () => /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    [],
  );

  if (dismissed || isInstalled) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore storage errors
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <Alert className="mb-6 border-primary/30 bg-primary/5">
      <Download className="h-4 w-4 text-primary" />
      <AlertTitle className="flex items-center justify-between">
        <span>Install Flowcheq on your device</span>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss install prompt">
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Use the same web app as an installable app on mobile and desktop for faster access.
        </p>
        {deferredPrompt ? (
          <Button size="sm" onClick={() => void install()}>
            Install app
          </Button>
        ) : isIOS ? (
          <div className="text-sm text-muted-foreground flex items-start gap-2">
            <Share2 className="h-4 w-4 mt-0.5 text-primary" />
            <span>On iPhone/iPad Safari: tap Share, then Add to Home Screen.</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open this site in a supported browser to install it as an app.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
