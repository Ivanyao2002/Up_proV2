export interface AccountantCountry {
  id: string;
  code: string;
  name: string;
}

export interface AccountantListItem {
  userId: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  status: string;
  active?: boolean;
  createdAt?: string;
  country?: AccountantCountry;
}

export interface AccountantCreatePayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryId?: string;
  countryCode?: string;
  phone?: string;
}

export interface AccountantCreateResponse {
  userId: string;
  portalLoginEmail: string;
  country?: AccountantCountry;
}
