import { FormEvent, Dispatch, SetStateAction } from 'react';
import { Loader2 } from 'lucide-react';
import { LandlordListingFormFields } from '@/components/landlord/LandlordListingFormFields';
import type { LandlordListingFormState } from '@/components/landlord/landlordListingFormState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LandlordEditListingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: LandlordListingFormState;
  setFormState: Dispatch<SetStateAction<LandlordListingFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isGeocoding: boolean;
  isPending: boolean;
};

export function LandlordEditListingDialog({
  open,
  onOpenChange,
  formState,
  setFormState,
  onSubmit,
  isGeocoding,
  isPending,
}: LandlordEditListingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <LandlordListingFormFields
            idPrefix="edit-"
            formState={formState}
            setFormState={setFormState}
            mode="edit"
          />

          <Button type="submit" className="w-full" disabled={isPending || isGeocoding}>
            {isGeocoding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting location...
              </>
            ) : isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Listing'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
