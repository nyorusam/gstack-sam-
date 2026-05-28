import { callGeminiFlash } from '../gemini'
import { callClaude } from '../claude'
import type { Incident } from '@/types/aria'

export interface MonitorOutput {
  type: string
  severity: string
  signals: string[]
  summary: string
  confidence: number
}

function buildPrompt(incident: Partial<Incident>): string {
  return `You are ARIA's Monitor Agent — the real-time alert classifier for enterprise incident response.

Analyze this incoming alert and respond with ONLY valid JSON (no markdown, no explanation):

Alert:
${JSON.stringify(incident.raw_data, null, 2)}
Title: ${incident.title}
Source: ${incident.source}

Respond with:
{
  "type": "database|security|api|compliance|service",
  "severity": "critical|high|medium|low",
  "signals": ["key signal 1", "key signal 2", "key signal 3"],
  "summary": "One sentence: what is happening and why it matters",
  "confidence": 0.0-1.0
}`
}

function parseOutput(raw: string): MonitorOutput {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const json = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(json) as MonitorOutput
}

export async function runMonitorAgent(incident: Partial<Incident>): Promise<MonitorOutput> {
  const prompt = buildPrompt(incident)

  try {
    const raw = await callGeminiFlash(prompt)
    return parseOutput(raw)
  } catch (geminiErr) {
    console.warn('Monitor: Gemini unavailable, falling back to Claude:', String(geminiErr).slice(0, 100))
    const { text } = await callClaude(
      'You are ARIA\'s Monitor Agent — classify enterprise incidents. Always respond with valid JSON only.',
      prompt,
      512
    )
    return parseOutput(text)
  }
}
