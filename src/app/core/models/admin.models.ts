export interface Client {
  id: string;
  name: string;
  clientName?: string;
  code?: string;
  email?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  active?: boolean;
  isActive?: boolean;
}
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
export interface Role {
  id: string;
  name: string;
  description: string;
  level: 'Client' | 'Site';
}
export interface User {
  id: string;
  userId?: string;
  userName?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string;
  phoneNumber?: string;
  clientId?: string;
  clientName?: string;
  client?: any;
  siteId?: string;
  siteIds?: string[];
  role?: string;
  roleIds?: string[];
  roles?: string[];
  siteRoles?: { siteId: string; role: string }[];
  status?: 'Active' | 'Inactive';
  active?: boolean;
  isActive?: boolean;
}
export type AdminEntity = Client | Site | Role | User;
