import { createServerClient } from '../supabase/server'
import type { Incident, AgentRun, Action } from '@/types/aria'
import type { MonitorOutput } from './monitor'
import type { TriageOutput } from './triage'
import type { InvestigateOutput } from './investigate'
import type { RespondOutput } from './respond'

export interface AuditOutput {
  audit_id: string
  records_written: number
}

export async function runAuditAgent(
  incident: Incident,
  agentRuns: Partial<AgentRun>[],
  actions: Action[],
  monitorOutput: MonitorOutput,
  triageOutput: TriageOutput,
  investigateOutput: InvestigateOutput,
  respondOutput: RespondOutput
): Promise<AuditOutput> {
  const supabase = createServerClient()

  const auditEvents = [
    { event: 'incident_ingested', actor: 'system', details: { incident_id: incident.id, severity: incident.severity } },
    { event: 'monitor_complete', actor: 'monitor', details: { severity: monitorOutput.severity, confidence: monitorOutput.confidence, signals: monitorOutput.signals } },
    { event: 'triage_complete', actor: 'triage', details: { blast_radius: triageOutput.blast_radius, urgency: triageOutput.urgency_score, escalate: triageOutput.escalate_to_human } },
    { event: 'investigation_complete', actor: 'investigate', details: { root_cause: investigateOutput.root_cause, confidence: investigateOutput.confidence } },
    { event: 'response_plan_generated', actor: 'respond', details: { action_count: actions.length, resolution_time: respondOutput.estimated_resolution_time } },
    { event: 'incident_resolved', actor: 'aria', details: { total_actions: actions.length, final_severity: respondOutput.severity_final } },
  ]

  const { data, error } = await supabase
    .from('audit_log')
    .insert(auditEvents.map(e => ({ ...e, incident_id: incident.id })))
    .select('id')

  if (error) throw new Error(`Audit write failed: ${error.message}`)

  await supabase
    .from('incidents')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', incident.id)

  return {
    audit_id: data?.[0]?.id ?? 'unknown',
    records_written: auditEvents.length
  }
}
