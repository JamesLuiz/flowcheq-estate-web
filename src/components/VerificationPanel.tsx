import { useState } from 'react';
import { ShieldCheck, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

export const VerificationPanel = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerification = async () => {
    setIsLoading(true);
    
    // Persona verification flow
    // In production, this would integrate with Persona's embed SDK
    const personaTemplateId = import.meta.env.VITE_PERSONA_TEMPLATE_ID || 'itmpl_test';
    const personaEnvironment = import.meta.env.VITE_PERSONA_ENV || 'sandbox';
    
    window.open(
      `https://withpersona.com/verify?template-id=${personaTemplateId}&environment=${personaEnvironment}`,
      '_blank',
      'width=600,height=800'
    );
    
    setIsLoading(false);
  };

  const getStatusBadge = () => {
    switch (user?.verificationStatus) {
      case 'pending':
        return (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Verification Pending</AlertTitle>
            <AlertDescription>
              Your verification is being reviewed. This usually takes 24-48 hours.
            </AlertDescription>
          </Alert>
        );
      case 'approved':
        return (
          <Alert className="border-primary/50 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Verified Agent</AlertTitle>
            <AlertDescription>
              Your account has been verified. You now have a verification badge on your profile.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>
              Your verification was not successful. Please try again with valid documents.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  if (user?.verified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verification Status
          </CardTitle>
          <CardDescription>Your account is verified</CardDescription>
        </CardHeader>
        <CardContent>
          {getStatusBadge()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Get Verified
        </CardTitle>
        <CardDescription>
          Verify your identity to build trust with potential clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusBadge()}
        
        {user?.verificationStatus !== 'pending' && (
          <>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Benefits of verification:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verification badge on your profile</li>
                <li>Increased trust from potential clients</li>
                <li>Higher visibility in search results</li>
                <li>Priority support from our team</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleVerification} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening verification...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Start Verification
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
