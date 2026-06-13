import { Smartphone, Apple, Download, ShieldCheck, MapPin, Camera, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSeo } from '@/lib/seo';

const APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL ||
  'https://estate.flowcheq.com/downloads/flowcheq-estate-android.apk';

export default function AgentsAppDownload() {
  useSeo({
    title: 'Install Flowcheq Estate — Agent App (Android & iPhone)',
    description:
      'Free official install for verified agents. Android: download signed APK from this site. iPhone: add Flowcheq Estate to your home screen from Safari — no App Store fee required.',
    url: '/agents/app',
    keywords:
      'Flowcheq Estate agent app, APK download, install PWA iPhone, property agent app Nigeria',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container max-w-3xl py-14 md:py-20 text-center">
            <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Install the Agent App
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Free install from this website — no App Store or Play Store account required. Android
              uses a signed APK; iPhone uses Add to Home Screen (Apple does not allow direct app
              file downloads).
            </p>
          </div>
        </section>

        <section className="container max-w-3xl py-12 space-y-6">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Agent account required</AlertTitle>
            <AlertDescription>
              After installing,{' '}
              <Link to="/auth" className="text-primary font-medium hover:underline">
                sign in as an agent
              </Link>
              . You must be approved by a landlord to capture listings.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {/* Android */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="h-5 w-5 text-primary" />
                  Android — download APK
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Our APK is <strong>release-signed</strong> (same trust model as Play Store apps).
                  You may see a one-time prompt to allow install from your browser — that is normal
                  for apps not installed via Google Play.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href={APK_URL} download rel="noopener noreferrer">
                    Download Flowcheq Estate (Android APK)
                  </a>
                </Button>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Tap the button above and wait for the download</li>
                  <li>Open the file → Install (allow “unknown apps” for Chrome if asked)</li>
                  <li>If Play Protect scans the app, tap <strong>Install anyway</strong></li>
                  <li>Open the app and sign in</li>
                </ol>
              </CardContent>
            </Card>

            {/* iPhone PWA */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Apple className="h-5 w-5 text-primary" />
                  iPhone / iPad — Add to Home Screen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Apple <strong>does not allow</strong> installing app files from websites without a
                  paid developer account. The free official option is a{' '}
                  <strong>web app on your home screen</strong> — it opens full-screen like an app.
                </p>
                <Button asChild variant="secondary" className="w-full sm:w-auto">
                  <Link to="/auth">Open agent sign-in</Link>
                </Button>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground shrink-0">1.</span>
                    Open this page in <strong>Safari</strong> (not Chrome)
                  </li>
                  <li className="flex gap-2">
                    <Share className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>
                      Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> →{' '}
                      <strong>Add</strong>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground shrink-0">3.</span>
                    Launch <strong>Flowcheq Estate</strong> from your home screen
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground shrink-0">4.</span>
                    Sign in and use the agent dashboard on mobile
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card className="border-muted bg-muted/30">
            <CardContent className="p-6 grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-2">
                <Camera className="h-5 w-5 text-primary shrink-0" />
                <span>Camera + GPS for on-site verification</span>
              </div>
              <div className="flex gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Works on Android APK and iPhone web app</span>
              </div>
              <div className="flex gap-2">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <span>$0 — no store developer fees required</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            APK not installing?{' '}
            <a href="/contact" className="text-primary hover:underline">
              Contact support
            </a>
            . Later you can publish to Google Play / App Store to reduce install prompts — optional.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
