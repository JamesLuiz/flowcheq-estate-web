import { FormEvent, Dispatch, SetStateAction } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { ListingPhotosGuard } from '@/components/landlord/ListingPhotosGuard';
import { OwnershipDocumentsUpload } from '@/components/landlord/OwnershipDocumentsUpload';
import { LandlordListingFormFields } from '@/components/landlord/LandlordListingFormFields';
import type { LandlordListingFormState } from '@/components/landlord/landlordListingFormState';
import { GPS_PHOTO_MAX } from '@/lib/listing-requirements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type LandlordCreateListingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: LandlordListingFormState;
  setFormState: Dispatch<SetStateAction<LandlordListingFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isGeocoding: boolean;
  isPending: boolean;
};

export function LandlordCreateListingDialog({
  open,
  onOpenChange,
  formState,
  setFormState,
  onSubmit,
  isGeocoding,
  isPending,
}: LandlordCreateListingDialogProps) {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Add New Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <LandlordListingFormFields
            formState={formState}
            setFormState={setFormState}
            mode="create"
          />

          <ListingPhotosGuard photoCount={formState.taggedPhotos.length}>
            {formState.taggedPhotos.map((photo, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2 bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Photo {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        taggedPhotos: prev.taggedPhotos.filter((_, i) => i !== index),
                      }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tag-${index}`} className="text-xs">
                    Room Tag
                  </Label>
                  <Select
                    value={photo.tag}
                    onValueChange={(value) => {
                      setFormState((prev) => ({
                        ...prev,
                        taggedPhotos: prev.taggedPhotos.map((p, i) =>
                          i === index ? { ...p, tag: value } : p,
                        ),
                      }));
                    }}
                  >
                    <SelectTrigger id={`tag-${index}`}>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="sitting-room">Sitting Room</SelectItem>
                      <SelectItem value="lobby">Lobby</SelectItem>
                      <SelectItem value="toilet">Toilet</SelectItem>
                      <SelectItem value="full-photo">Full Photo of House</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="balcony">Balcony</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label htmlFor={`desc-${index}`} className="text-xs">
                    Description (Optional)
                  </Label>
                  <Input
                    id={`desc-${index}`}
                    placeholder="e.g., Modern kitchen with island"
                    value={photo.description}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        taggedPhotos: prev.taggedPhotos.map((p, i) =>
                          i === index ? { ...p, description: event.target.value } : p,
                        ),
                      }));
                    }}
                  />
                </div>
              </div>
            ))}

            {formState.taggedPhotos.length < GPS_PHOTO_MAX && (
              <div>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          variant: 'destructive',
                          title: 'Image too large',
                          description: 'Image must be less than 5MB',
                        });
                        return;
                      }
                      setFormState((prev) => ({
                        ...prev,
                        taggedPhotos: [...prev.taggedPhotos, { file, tag: '', description: '' }],
                      }));
                      event.target.value = '';
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add photo ({formState.taggedPhotos.length}/{GPS_PHOTO_MAX})
                </p>
              </div>
            )}
          </ListingPhotosGuard>

          <OwnershipDocumentsUpload
            listingType={formState.listingType}
            files={formState.ownershipDocs}
            onChange={(type, file) =>
              setFormState((prev) => ({
                ...prev,
                ownershipDocs: { ...prev.ownershipDocs, [type]: file },
              }))
            }
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
                Publishing...
              </>
            ) : (
              'Create Listing'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
