import { Loader2, EyeOff, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type LandlordPinResetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetCodeSent: boolean;
  setResetCodeSent: (v: boolean) => void;
  resetCode: string;
  setResetCode: (v: string) => void;
  newPinAfterReset: string;
  setNewPinAfterReset: (v: string) => void;
  confirmNewPin: string;
  setConfirmNewPin: (v: string) => void;
  showResetCode: boolean;
  setShowResetCode: (v: boolean) => void;
  showResetPin: boolean;
  setShowResetPin: (v: boolean) => void;
  onRequestReset: () => void;
  onConfirmReset: () => void;
  isRequesting: boolean;
  isResetting: boolean;
};

export function LandlordPinResetDialog({
  open,
  onOpenChange,
  resetCodeSent,
  setResetCodeSent,
  resetCode,
  setResetCode,
  newPinAfterReset,
  setNewPinAfterReset,
  confirmNewPin,
  setConfirmNewPin,
  showResetCode,
  setShowResetCode,
  showResetPin,
  setShowResetPin,
  onRequestReset,
  onConfirmReset,
  isRequesting,
  isResetting,
}: LandlordPinResetDialogProps) {
  const { toast } = useToast();

  const handleClose = () => {
    onOpenChange(false);
    setResetCode('');
    setNewPinAfterReset('');
    setConfirmNewPin('');
    setResetCodeSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle>Reset Transaction PIN</DialogTitle>
          <DialogDescription>
            Request a reset code via email, then enter it along with your new PIN
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 sm:py-4">
          {!resetCodeSent ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  A 6-digit reset code will be sent to your email. The code expires in 15 minutes.
                </AlertDescription>
              </Alert>
              <Button onClick={onRequestReset} disabled={isRequesting} className="w-full">
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>Send Reset Code to Email</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Reset Code</Label>
                <div className="relative">
                  <Input
                    type={showResetCode ? 'text' : 'password'}
                    placeholder="Enter 6-digit reset code"
                    value={resetCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetCode(value);
                    }}
                    maxLength={6}
                    className="pr-10 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowResetCode(!showResetCode)}
                  >
                    {showResetCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">New Transaction PIN (6 digits)</Label>
                <div className="relative">
                  <Input
                    type={showResetPin ? 'text' : 'password'}
                    placeholder="Enter new 6-digit PIN"
                    value={newPinAfterReset}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setNewPinAfterReset(value);
                    }}
                    maxLength={6}
                    className="pr-10 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowResetPin(!showResetPin)}
                  >
                    {showResetPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Confirm New PIN</Label>
                <Input
                  type={showResetPin ? 'text' : 'password'}
                  placeholder="Confirm new 6-digit PIN"
                  value={confirmNewPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setConfirmNewPin(value);
                  }}
                  maxLength={6}
                  className="text-base"
                />
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => {
                  setResetCode('');
                  setNewPinAfterReset('');
                  setConfirmNewPin('');
                  setResetCodeSent(false);
                }}
              >
                Request new code
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          {resetCodeSent && (
            <Button
              onClick={() => {
                if (!resetCode || resetCode.length !== 6) {
                  toast({
                    variant: 'destructive',
                    title: 'Invalid code',
                    description: 'Please enter the 6-digit reset code',
                  });
                  return;
                }
                if (!newPinAfterReset || newPinAfterReset.length !== 6 || !/^\d{6}$/.test(newPinAfterReset)) {
                  toast({
                    variant: 'destructive',
                    title: 'Invalid PIN',
                    description: 'PIN must be exactly 6 digits',
                  });
                  return;
                }
                if (newPinAfterReset !== confirmNewPin) {
                  toast({
                    variant: 'destructive',
                    title: 'PIN mismatch',
                    description: 'PINs do not match',
                  });
                  return;
                }
                onConfirmReset();
              }}
              disabled={
                isResetting ||
                resetCode.length !== 6 ||
                newPinAfterReset.length !== 6 ||
                confirmNewPin.length !== 6
              }
              className="w-full sm:w-auto"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                </>
              ) : (
                <>Reset PIN</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
