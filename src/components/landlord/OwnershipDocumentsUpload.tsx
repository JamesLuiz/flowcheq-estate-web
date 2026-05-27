import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  OWNERSHIP_DOC_LABELS,
  requiredOwnershipDocs,
  type OwnershipDocType,
} from '@/lib/listing-requirements';

type Props = {
  listingType: 'rent' | 'buy';
  files: Partial<Record<OwnershipDocType, File | null>>;
  onChange: (type: OwnershipDocType, file: File | null) => void;
};

export function OwnershipDocumentsUpload({ listingType, files, onChange }: Props) {
  const required = requiredOwnershipDocs(listingType);

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div>
        <Label className="text-base">Ownership documents (required)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          {listingType === 'rent'
            ? 'For rent: C of O and a utility bill for this property.'
            : 'For sale: C of O, deed, governor\'s consent, and land survey plan.'}
        </p>
      </div>
      {required.map((type) => (
        <div key={type} className="space-y-1">
          <Label htmlFor={`doc-${type}`}>{OWNERSHIP_DOC_LABELS[type]}</Label>
          <Input
            id={`doc-${type}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && file.size > 10 * 1024 * 1024) {
                onChange(type, null);
                e.target.value = '';
                return;
              }
              onChange(type, file);
            }}
          />
          {files[type] && (
            <p className="text-xs text-muted-foreground">
              {files[type]!.name} ({(files[type]!.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
