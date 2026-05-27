/** Role helpers aligned with backend UserRole enum */
export const LISTING_OWNER_ROLES = ['landlord', 'real_estate_company', 'company'] as const;
export const AGENT_ROLES = ['agent'] as const;
export const HOUSE_HUNTER_ROLES = ['user', 'tenant', 'house_hunter'] as const;
export const ADMIN_ROLES = ['admin'] as const;

export type ListingOwnerRole = (typeof LISTING_OWNER_ROLES)[number];

export function isListingOwnerRole(role?: string | null): boolean {
  return LISTING_OWNER_ROLES.includes(role as ListingOwnerRole);
}

export function isAgentRole(role?: string | null): boolean {
  return role === 'agent';
}

export function isAdminRole(role?: string | null): boolean {
  return role === 'admin';
}

export function isHouseHunterRole(role?: string | null): boolean {
  return HOUSE_HUNTER_ROLES.includes(role as (typeof HOUSE_HUNTER_ROLES)[number]);
}

/** Default dashboard route after login for each role */
export function getDashboardPathForRole(role?: string | null): string {
  if (isAdminRole(role)) return '/admin';
  if (isAgentRole(role)) return '/agent/dashboard';
  if (isListingOwnerRole(role)) return '/landlord/dashboard';
  return '/user-dashboard';
}

export function getWalletPathForRole(role?: string | null): string {
  if (isAgentRole(role)) return '/agent/wallet';
  if (isListingOwnerRole(role)) return '/landlord/wallet';
  return '/user-dashboard';
}
