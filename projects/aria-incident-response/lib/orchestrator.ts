import { createServerClient } from './supabase/server'
import { runMonitorAgent } from './agents/monitor'
import { runTriageAgent } from './agents/triage'
import { runInvestigateAgent } from './agents/investigate'
import { runRespondAgent } from './agents/respond'
import { runAuditAgent } from './agents/audit'
import type { Incident, Action, AgentName } from '@/types/aria'

export interface AgentEvent {
  agent: AgentName
  status: 'running' | 'done' | 'error'
  model: string
  thought?: string
  output?: Record<string, unknown>
  duration_ms?: number
  error?: string
}

export type EventEmitter = (event: AgentEvent) => void

export async function runPipeline(
  incident: Incident,
  emit: EventEmitter
): Promise<void> {
  const supabase = createServerClient()
  const agentRunIds: Record<string, string> = {}

  async function startRun(agent: AgentName, model: string, input: Record<string, unknown>) {
    const { data } = await supabase
      .from('agent_runs')
      .insert({ incident_id: incident.id, agent_name: agent, model, status: 'running', input })
      .select('id')
      .single()
    agentRunIds[agent] = data?.id
    emit({ agent, status: 'running', model })
    return Date.now()
  }

  async function completeRun(
    agent: AgentName,
    startTime: number,
    output: Record<string, unknown>,
    chainOfThought?: string
  ) {
    const duration_ms = Date.now() - startTime
    if (agentRunIds[agent]) {
      await supabase
        .from('agent_runs')
        .update({ status: 'done', output, chain_of_thought: chainOfThought, duration_ms })
        .eq('id', agentRunIds[agent])
    }
    emit({ agent, status: 'done', model: '', output, duration_ms })
  }

  async function failRun(agent: AgentName, startTime: number, error: string) {
    const duration_ms = Date.now() - startTime
    if (agentRunIds[agent]) {
      await supabase
        .from('agent_runs')
        .update({ status: 'error', output: { error }, duration_ms })
        .eq('id', agentRunIds[agent])
    }
    emit({ agent, status: 'error', model: '', error, duration_ms })
  }

  // Agent 1: Monitor
  const t1 = await startRun('monitor', 'gemini-2.0-flash', { incident: incident.raw_data })
  let monitorOutput
  try {
    monitorOutput = await runMonitorAgent(incident)
    await completeRun('monitor', t1, monitorOutput as unknown as Record<string, unknown>)
  } catch (e) {
    await failRun('monitor', t1, String(e))
    throw e
  }

  // Update incident status
  await supabase.from('incidents').update({ status: 'triaged' }).eq('id', incident.id)

  // Agent 2: Triage
  const t2 = await startRun('triage', 'gemini-1.5-pro', { monitorOutput })
  let triageOutput
  try {
    triageOutput = await runTriageAgent(incident, monitorOutput)
    await completeRun('triage', t2, triageOutput as unknown as Record<string, unknown>)
  } catch (e) {
    await failRun('triage', t2, String(e))
    throw e
  }

  await supabase.from('incidents').update({ status: 'investigating' }).eq('id', incident.id)

  // Agent 3: Investigate
  const t3 = await startRun('investigate', 'claude-sonnet-4-6', { monitorOutput, triageOutput })
  let investigateOutput
  try {
    investigateOutput = await runInvestigateAgent(incident, monitorOutput, triageOutput)
    await completeRun(
      'investigate',
      t3,
      investigateOutput as unknown as Record<string, unknown>,
      investigateOutput.chain_of_thought
    )
    emit({
      agent: 'investigate',
      status: 'done',
      model: 'claude-sonnet-4-6',
      thought: investigateOutput.chain_of_thought,
      output: investigateOutput as unknown as Record<string, unknown>
    })
  } catch (e) {
    await failRun('investigate', t3, String(e))
    throw e
  }

  // Agent 4: Respond
  const t4 = await startRun('respond', 'claude-sonnet-4-6', { monitorOutput, triageOutput, investigateOutput })
  let respondOutput
  try {
    respondOutput = await runRespondAgent(incident, monitorOutput, triageOutput, investigateOutput)
    await completeRun('respond', t4, respondOutput as unknown as Record<string, unknown>)
  } catch (e) {
    await failRun('respond', t4, String(e))
    throw e
  }

  // Write actions to DB
  const actionsToInsert = respondOutput.actions.map(a => ({
    ...a,
    incident_id: incident.id
  }))
  const { data: insertedActions } = await supabase
    .from('actions')
    .insert(actionsToInsert)
    .select('*')
  const actions = (insertedActions ?? []) as Action[]

  // Agent 5: Audit
  const t5 = await startRun('audit', 'supabase', { action_count: actions.length })
  try {
    const auditOutput = await runAuditAgent(
      incident,
      Object.entries(agentRunIds).map(([name, id]) => ({ agent_name: name as AgentName, id })),
      actions,
      monitorOutput,
      triageOutput,
      investigateOutput,
      respondOutput
    )
    await completeRun('audit', t5, auditOutput as unknown as Record<string, unknown>)
  } catch (e) {
    await failRun('audit', t5, String(e))
    throw e
  }
}
