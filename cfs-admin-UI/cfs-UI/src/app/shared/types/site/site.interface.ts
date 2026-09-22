export interface Site {
  id: string;
  clientId: string;
  name: string;
  siteName?: string;
  code: string;
  siteCode?: string;
  city?: string;
  status: 'Active' | 'Inactive';
  active?: boolean;
  isActive?: boolean;
}

export interface CreateSiteRequest {
  clientId?: string;
  ClientId?: string;
  name?: string;
  Name?: string;
  code?: string;
  Code?: string;
}

export interface UpdateSiteRequest {
  clientId?: string;
  ClientId?: string;
  name?: string;
  Name?: string;
  code?: string;
  Code?: string;
}
