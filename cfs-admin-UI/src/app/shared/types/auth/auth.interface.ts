export interface LoginRequest {
  userName?: string;
  password?: string;
  UserName?: string;
  Password?: string;
}

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  jwtToken?: string;
  AccessToken?: string;
  Token?: string;
  JwtToken?: string;
  refreshToken?: string;
  RefreshToken?: string;
  expiresAt?: string;
  ExpiresAt?: string;
  data?: LoginResponse;
  result?: LoginResponse;
}

export interface ContextRequest {
  clientId?: string | null;
  siteId?: string | null;
  ClientId?: string | null;
  SiteId?: string | null;
}

export interface RefreshRequest {
  refreshToken?: string;
  RefreshToken?: string;
  accessToken?: string;
  AccessToken?: string;
}

export interface ForgotPasswordRequest {
  userNameOrEmail?: string;
  UserNameOrEmail?: string;
}

export interface ResetPasswordRequest {
  token?: string;
  newPassword?: string;
  Token?: string;
  NewPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  CurrentPassword?: string;
  NewPassword?: string;
}

export interface ContextClient {
  id: string;
  name: string;
  code?: string;
}

export interface UserSiteDto {
  id: string;
  siteId?: string;
  name: string;
  code: string;
  clientId: string;
  clientName?: string;
}

export interface UserProfileDto {
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber?: string;
  roles?: string[];
  sites?: UserSiteDto[];
}

export interface NavigationModuleDto {
  id: string;
  title: string;
  transKey: string;
  icon: string;
  route?: string | null;
  order?: number;
  children?: NavigationModuleDto[] | null;
}
