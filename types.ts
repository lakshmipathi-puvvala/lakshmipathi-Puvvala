export interface WebhookResponse {
  raw: any;
  status: number;
  ok: boolean;
}

export interface SimplifiedProfile {
  summary: string;
  name?: string;
  headline?: string;
  keySkills?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  error?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  SENDING_WEBHOOK = 'SENDING_WEBHOOK',
  PROCESSING_AI = 'PROCESSING_AI',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'offline';
  lastLogin: string;
  profilesProcessed: number;
  password?: string; // Added to store password for admin view
}