import { Smartphone, Apple, Download, ShieldCheck, MapPin, Camera } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSeo } from '@/lib/seo';

const PLAY_URL =
  import.meta.env.VITE_ANDROID_PLAY_URL ||
  'https://play.google.com/store/apps/details?id=com.flowcheq.estate';
const APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL ||
  'https://estate.flowcheq.com/downloads/flowcheq-estate-android.apk';
const IOS_URL =
  import.meta.env.VITE_IOS_APP_STORE_URL || 'https://apps.apple.com/app/flowcheq-estate';

export default function AgentsAppDownload() {
  useSeo({
    title: 'Download the Flowcheq Estate Agent App',
    description:
      'Official Flowcheq Estate mobile app for verified field agents. GPS-verified property capture on Android and iOS. Download from Google Play, the App Store, or direct Android APK.',
    url: '/agents/app',
    keywords:
      'Flowcheq Estate app download, real estate agent app Nigeria, property verification app Abuja, GPS capture app',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container max-w-3xl py-14 md:py-20 text-center">
            <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Flowcheq Estate — Agent App
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Official app for verified agents. Capture GPS-stamped listing photos on-site with
              Flowcheq Capture. Available on Android and iOS.
            </p>
          </div>
        </section>

        <section className="container max-w-3xl py-12 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <Download className="h-10 w-10 text-primary" />
                <div>
                  <h2 className="font-semibold text-lg">Android</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Google Play (recommended) or direct APK for approved agents.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button asChild className="w-full">
                    <a href={PLAY_URL} target="_blank" rel="noopener noreferrer">
                      Get it on Google Play
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href={APK_URL} download rel="noopener noreferrer">
                      Download APK (Android)
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <Apple className="h-10 w-10 text-primary" />
                <div>
                  <h2 className="font-semibold text-lg">iPhone / iPad</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Install from the App Store. Apple does not allow direct IPA downloads from
                    websites.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <a href={IOS_URL} target="_blank" rel="noopener noreferrer">
                    Download on the App Store
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-2">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <span>Agent account required — sign in after install</span>
              </div>
              <div className="flex gap-2">
                <Camera className="h-5 w-5 text-primary shrink-0" />
                <span>Live camera + GPS — no gallery uploads</span>
              </div>
              <div className="flex gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>On-site verification for managed properties</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact us via{' '}
            <a href="/contact" className="text-primary hover:underline">
              support
            </a>
            . Agents must be approved by a landlord before capturing listings.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
