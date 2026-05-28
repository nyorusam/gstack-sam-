import { callClaude } from '../claude'
import { callGeminiFlash } from '../gemini'
import type { Incident, Action } from '@/types/aria'
import type { MonitorOutput } from './monitor'
import type { TriageOutput } from './triage'
import type { InvestigateOutput } from './investigate'

export interface RespondOutput {
  actions: Omit<Action, 'id' | 'incident_id' | 'created_at'>[]
  runbook: string
  estimated_resolution_time: string
  severity_final: string
  summary: string
}

function buildPrompt(
  incident: Partial<Incident>,
  monitorOutput: MonitorOutput,
  triageOutput: TriageOutput,
  investigateOutput: InvestigateOutput
): string {
  return `Generate an incident response plan for this enterprise incident.

INCIDENT: ${incident.title}
SOURCE: ${incident.source}

ROOT CAUSE: ${investigateOutput.root_cause}
CONFIDENCE: ${investigateOutput.confidence}
CONTRIBUTING FACTORS: ${investigateOutput.contributing_factors.join(', ')}

BLAST RADIUS: ${triageOutput.blast_radius}
URGENCY: ${triageOutput.urgency_score}/10
ESCALATE TO HUMAN: ${triageOutput.escalate_to_human}

Generate 3-5 specific response actions. Be concrete — real tickets, real commands, real people.

Respond ONLY with valid JSON:
{
  "summary": "One sentence executive summary of the response plan",
  "severity_final": "critical|high|medium|low",
  "estimated_resolution_time": "e.g. 15-30 minutes",
  "runbook": "Step-by-step resolution: 1. ... 2. ... 3. ...",
  "actions": [
    {
      "action_type": "ticket|notification|runbook|escalation",
      "priority": "immediate|urgent|normal",
      "assignee": "team or person name",
      "title": "Short action title",
      "description": "Detailed action description with specific commands or steps",
      "status": "pending"
    }
  ]
}`
}

function parseOutput(raw: string): RespondOutput {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(json) as RespondOutput
}

export async function runRespondAgent(
  incident: Partial<Incident>,
  monitorOutput: MonitorOutput,
  triageOutput: TriageOutput,
  investigateOutput: InvestigateOutput
): Promise<RespondOutput> {
  const system = `You are ARIA's Respond Agent — you generate concrete, actionable incident response plans.
Every action has a clear owner, priority, and description. Always respond with valid JSON only.`

  const prompt = buildPrompt(incident, monitorOutput, triageOutput, investigateOutput)

  try {
    const { text } = await callClaude(system, prompt, 1024)
    return parseOutput(text)
  } catch (claudeErr) {
    console.warn('Respond: Claude unavailable, using Gemini:', String(claudeErr).slice(0, 120))
    const raw = await callGeminiFlash(
      `${system}\n\nYou are generating a response plan. ${prompt}`
    )
    return parseOutput(raw)
  }
}
