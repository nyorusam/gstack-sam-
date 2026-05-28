export type IncidentType = 'database' | 'security' | 'api' | 'compliance' | 'service';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'triaged' | 'investigating' | 'resolved';
export type AgentName = 'monitor' | 'triage' | 'investigate' | 'respond' | 'audit';
export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  source: string;
  title: string;
  raw_data: Record<string, unknown>;
  status: IncidentStatus;
  created_at: string;
  resolved_at?: string;
}

export interface AgentRun {
  id: string;
  incident_id: string;
  agent_name: AgentName;
  model: string;
  status: AgentStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  chain_of_thought?: string;
  duration_ms?: number;
  created_at: string;
}

export interface Action {
  id: string;
  incident_id: string;
  action_type: 'ticket' | 'notification' | 'runbook' | 'escalation';
  priority: 'immediate' | 'urgent' | 'normal';
  assignee?: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface AgentStreamEvent {
  agent: AgentName;
  status: AgentStatus;
  model: string;
  thought?: string;
  output?: Record<string, unknown>;
  duration_ms?: number;
  error?: string;
}

export interface PipelineResult {
  incident: Incident;
  agents: AgentRun[];
  actions: Action[];
  audit_id: string;
  total_duration_ms: number;
}
