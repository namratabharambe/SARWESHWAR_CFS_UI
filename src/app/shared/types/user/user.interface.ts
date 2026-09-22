export interface UserSiteAssignmentRequest {
  siteId?: string;
  SiteId?: string;
  role?: string;
  Role?: string;
}

export interface CreateUserRequest {
  userName?: string;
  UserName?: string;
  password?: string;
  Password?: string;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  email?: string | null;
  Email?: string | null;
  mobileNumber?: string | null;
  MobileNumber?: string | null;
  clientId?: string | null;
  ClientId?: string | null;
  siteId?: string | null;
  SiteId?: string | null;
  role?: string | null;
  Role?: string | null;
  siteRoles?: UserSiteAssignmentRequest[] | null;
  SiteRoles?: UserSiteAssignmentRequest[] | null;
}

export interface UpdateUserRequest {
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  email?: string | null;
  Email?: string | null;
  mobileNumber?: string | null;
  MobileNumber?: string | null;
  siteRoles?: UserSiteAssignmentRequest[] | null;
  SiteRoles?: UserSiteAssignmentRequest[] | null;
}

export interface AssignClientRoleRequest {
  clientId?: string;
  ClientId?: string;
  role?: string;
  Role?: string;
}

export interface AssignSiteRoleRequest {
  siteId?: string;
  SiteId?: string;
  role?: string;
  Role?: string;
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
