import { Smartphone, Apple, Download, ShieldCheck, MapPin, Camera, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeo } from '@/lib/seo';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

const APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL ||
  'https://estate.flowcheq.com/downloads/flowcheq-estate-android.apk';

export default function AgentsAppDownload() {
  useSeo({
    title: 'Install Flowcheq Estate — Agent App',
    description:
      'Download the Flowcheq Estate agent app for Android or add to home screen on iPhone.',
    url: '/agents/app',
    keywords:
      'Flowcheq Estate agent app, property agent app Nigeria, real estate app Abuja',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container max-w-2xl py-10 md:py-14 text-center px-4">
            <Smartphone className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Get the Agent App
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture listings on-site with GPS-verified photos
            </p>
          </div>
        </section>

        <section className="container max-w-2xl py-8 px-4 space-y-5">
          <PwaInstallPrompt />

          {/* Android */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-5 w-5 text-primary" />
                Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild size="lg" className="w-full">
                <a href={APK_URL} download rel="noopener noreferrer">
                  Download APK
                </a>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Tap Install when prompted. Allow "unknown apps" if asked.
              </p>
            </CardContent>
          </Card>

          {/* iPhone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Apple className="h-5 w-5 text-primary" />
                iPhone / iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="text-sm text-muted-foreground space-y-3">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground shrink-0">1.</span>
                  <span>Open this site in <strong>Safari</strong></span>
                </li>
                <li className="flex gap-3">
                  <Share className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <span>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground shrink-0">3.</span>
                  <span>Open <strong>Flowcheq Estate</strong> from your home screen</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 text-xs text-center pt-2">
            <div className="flex flex-col items-center gap-1.5 p-3">
              <Camera className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">GPS Photos</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Location Verified</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Secure</span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Questions?{' '}
            <Link to="/contact" className="text-primary hover:underline">Contact support</Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
