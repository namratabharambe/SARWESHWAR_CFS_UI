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

export interface CreateClientRequest {
  name?: string;
  Name?: string;
}

export interface UpdateClientRequest {
  name?: string;
  Name?: string;
}
