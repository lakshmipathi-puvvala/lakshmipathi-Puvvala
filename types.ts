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