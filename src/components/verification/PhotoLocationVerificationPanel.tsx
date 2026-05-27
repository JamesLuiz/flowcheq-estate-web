import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Upload,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GooglePropertyMap } from '@/components/maps/GooglePropertyMap';
import { api } from '@/lib/api';
import type { PhotoLocationVerificationResult } from '@/types/location-verification';

interface PhotoLocationVerificationPanelProps {
  propertyId?: string;
  expectedAddress?: string;
  expectedLat?: number;
  expectedLng?: number;
  title?: string;
}

const statusConfig = {
  VERIFIED: {
    icon: CheckCircle2,
    variant: 'default' as const,
    label: 'Verified',
    className: 'border-green-500/40 bg-green-500/5',
  },
  MISMATCH: {
    icon: XCircle,
    variant: 'destructive' as const,
    label: 'Mismatch',
    className: 'border-red-500/40 bg-red-500/5',
  },
  UNVERIFIABLE: {
    icon: AlertCircle,
    variant: 'secondary' as const,
    label: 'Unverifiable',
    className: 'border-amber-500/40 bg-amber-500/5',
  },
};

export function PhotoLocationVerificationPanel({
  propertyId,
  expectedAddress,
  expectedLat,
  expectedLng,
  title = 'GPS photo location verification',
}: PhotoLocationVerificationPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<PhotoLocationVerificationResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: (file: File) =>
      api.locationVerification.verifyPhoto(file, {
        propertyId,
        expectedAddress,
        expectedLat,
        expectedLng,
      }),
    onSuccess: (data) => setResult(data),
  });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    verifyMutation.mutate(file);
  };

  const cfg = result ? statusConfig[result.matchStatus] : null;
  const StatusIcon = cfg?.icon ?? AlertCircle;

  const mapMarkers = [];
  if (result?.extractedCoordinates) {
    mapMarkers.push({
      lat: result.extractedCoordinates.lat,
      lng: result.extractedCoordinates.lng,
      label: result.resolvedAddress?.formatted ?? 'Photo GPS',
      variant: 'photo' as const,
    });
  }
  if (result?.expectedCoordinates) {
    mapMarkers.push({
      lat: result.expectedCoordinates.lat,
      lng: result.expectedCoordinates.lng,
      label: 'Expected property',
      variant: 'expected' as const,
    });
  }

  const mapCenter = result?.extractedCoordinates ??
    result?.expectedCoordinates ?? { lat: 9.0765, lng: 7.3986 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Upload a photo from a GPS-enabled camera. We read EXIF coordinates, reverse-geocode with Google,
          and compare to the registered address (within 100m).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={verifyMutation.isPending}
          className="w-full sm:w-auto"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing GPS metadata…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload inspection photo
            </>
          )}
        </Button>

        {preview && (
          <img
            src={preview}
            alt="Uploaded"
            className="max-h-40 rounded-lg border object-cover"
          />
        )}

        {result && cfg && (
          <>
            <Alert className={cfg.className}>
              <StatusIcon className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {cfg.label}
                <Badge variant={cfg.variant}>{result.confidenceScore}% confidence</Badge>
              </AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="font-medium text-muted-foreground">Photo GPS</p>
                {result.extractedCoordinates ? (
                  <p>
                    {result.extractedCoordinates.lat.toFixed(6)},{' '}
                    {result.extractedCoordinates.lng.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-amber-600">No EXIF GPS — retake with location on</p>
                )}
                {result.resolvedAddress && (
                  <p className="text-xs text-muted-foreground">{result.resolvedAddress.formatted}</p>
                )}
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="font-medium text-muted-foreground">Expected</p>
                <p>{result.expectedAddress}</p>
                {result.expectedCoordinates && (
                  <p className="text-xs text-muted-foreground">
                    {result.expectedCoordinates.lat.toFixed(6)},{' '}
                    {result.expectedCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.googleMapsLink && (
                <Button size="sm" variant="outline" asChild>
                  <a href={result.googleMapsLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Photo on Maps
                  </a>
                </Button>
              )}
              {result.googleMapsExpectedLink && result.matchStatus === 'MISMATCH' && (
                <Button size="sm" variant="outline" asChild>
                  <a href={result.googleMapsExpectedLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Expected on Maps
                  </a>
                </Button>
              )}
              {result.streetViewLink && result.extractedCoordinates && (
                <Button size="sm" variant="outline" asChild>
                  <a href={result.streetViewLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Street View
                  </a>
                </Button>
              )}
            </div>

            {(result.extractedCoordinates || result.expectedCoordinates) && (
              <GooglePropertyMap
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                markers={mapMarkers}
                zoom={18}
                defaultMapType="satellite"
                className="h-[320px] md:h-[400px]"
                distanceMeters={result.distanceMeters}
                resolvedAddressLabel={result.resolvedAddress?.formatted}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
