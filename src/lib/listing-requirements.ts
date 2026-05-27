export const INSPECTION_FEE_NGN = 5000;
export const GPS_PHOTO_MIN = 5;
export const GPS_PHOTO_MAX = 6;

export type OwnershipDocType =
  | 'c_of_o'
  | 'utility_bill'
  | 'deed'
  | 'governors_consent'
  | 'land_survey';

export const OWNERSHIP_DOC_LABELS: Record<OwnershipDocType, string> = {
  c_of_o: 'Certificate of Occupancy (C of O)',
  utility_bill: 'Utility bill (property address)',
  deed: 'Deed of assignment',
  governors_consent: "Governor's consent",
  land_survey: 'Land survey plan',
};

export function requiredOwnershipDocs(listingType: 'rent' | 'buy'): OwnershipDocType[] {
  if (listingType === 'rent') {
    return ['c_of_o', 'utility_bill'];
  }
  return ['c_of_o', 'deed', 'governors_consent', 'land_survey'];
}
