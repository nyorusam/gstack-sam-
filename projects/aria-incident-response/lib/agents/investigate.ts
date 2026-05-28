import { callClaude } from '../claude'
import { callGeminiPro } from '../gemini'
import type { Incident } from '@/types/aria'
import type { MonitorOutput } from './monitor'
import type { TriageOutput } from './triage'

export interface InvestigateOutput {
  root_cause: string
  contributing_factors: string[]
  confidence: number
  evidence: string[]
  chain_of_thought: string
}

function buildPrompt(
  incident: Partial<Incident>,
  monitorOutput: MonitorOutput,
  triageOutput: TriageOutput
): string {
  return `Perform a deep root-cause investigation for this enterprise incident.

INCIDENT: ${incident.title}
SOURCE: ${incident.source}
SEVERITY: ${monitorOutput.severity}
RAW DATA: ${JSON.stringify(incident.raw_data, null, 2)}

MONITOR ANALYSIS:
- Signals: ${monitorOutput.signals.join(', ')}
- Summary: ${monitorOutput.summary}

TRIAGE ASSESSMENT:
- Blast radius: ${triageOutput.blast_radius}
- Affected systems: ${triageOutput.affected_systems.join(', ')}
- Urgency: ${triageOutput.urgency_score}/10

Think step by step. Show your full reasoning chain. State what evidence supports each conclusion.

Respond ONLY with valid JSON:
{
  "chain_of_thought": "Step 1: [observation]. Step 2: [inference]. Step 3: [conclusion]... (full visible reasoning, 4-6 steps)",
  "root_cause": "The specific technical root cause",
  "contributing_factors": ["factor1", "factor2", "factor3"],
  "confidence": 0.0-1.0,
  "evidence": ["evidence item 1", "evidence item 2", "evidence item 3"]
}`
}

function parseOutput(raw: string): InvestigateOutput {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(json) as InvestigateOutput
}

export async function runInvestigateAgent(
  incident: Partial<Incident>,
  monitorOutput: MonitorOutput,
  triageOutput: TriageOutput
): Promise<InvestigateOutput> {
  const system = `You are ARIA's Investigate Agent — an expert SRE and security analyst performing deep root-cause analysis.
Your hallmark is transparency: you show every step of your reasoning process.
You never guess. You derive conclusions from evidence. Always respond with valid JSON only.`

  const prompt = buildPrompt(incident, monitorOutput, triageOutput)

  try {
    const { text } = await callClaude(system, prompt, 1024)
    return parseOutput(text)
  } catch (claudeErr) {
    console.warn('Investigate: Claude unavailable, using Gemini:', String(claudeErr).slice(0, 120))
    const raw = await callGeminiPro(
      `${system}\n\nYou are performing deep root-cause analysis. ${prompt}`
    )
    return parseOutput(raw)
  }
}
