import { callGeminiPro } from '../gemini'
import { callClaude } from '../claude'
import type { Incident } from '@/types/aria'
import type { MonitorOutput } from './monitor'

export interface TriageOutput {
  affected_systems: string[]
  blast_radius: 'contained' | 'spreading' | 'wide'
  urgency_score: number
  escalate_to_human: boolean
  estimated_impact: string
  priority_actions: string[]
}

function buildPrompt(incident: Partial<Incident>, monitorOutput: MonitorOutput): string {
  return `You are ARIA's Triage Agent — you assess blast radius and urgency for enterprise incidents.

Incident: ${incident.title}
Source: ${incident.source}
Monitor classified as: ${monitorOutput.severity} ${monitorOutput.type}
Key signals: ${monitorOutput.signals.join(', ')}
Summary: ${monitorOutput.summary}
Raw data: ${JSON.stringify(incident.raw_data, null, 2)}

Perform multi-step triage analysis. Consider:
1. Which systems are directly affected?
2. What downstream systems depend on these?
3. Is the blast radius contained, spreading, or wide?
4. What is the urgency score (1-10)?
5. Does this require immediate human escalation?

Respond with ONLY valid JSON (no markdown):
{
  "affected_systems": ["system1", "system2"],
  "blast_radius": "contained|spreading|wide",
  "urgency_score": 1-10,
  "escalate_to_human": true|false,
  "estimated_impact": "Brief impact statement",
  "priority_actions": ["action1", "action2", "action3"]
}`
}

function parseOutput(raw: string): TriageOutput {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(json) as TriageOutput
}

export async function runTriageAgent(
  incident: Partial<Incident>,
  monitorOutput: MonitorOutput
): Promise<TriageOutput> {
  const prompt = buildPrompt(incident, monitorOutput)

  try {
    const raw = await callGeminiPro(prompt)
    return parseOutput(raw)
  } catch (geminiErr) {
    console.warn('Triage: Gemini unavailable, falling back to Claude:', String(geminiErr).slice(0, 100))
    const { text } = await callClaude(
      'You are ARIA\'s Triage Agent — assess blast radius and urgency. Always respond with valid JSON only.',
      prompt,
      768
    )
    return parseOutput(text)
  }
}
