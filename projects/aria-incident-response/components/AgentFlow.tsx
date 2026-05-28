'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AgentName } from '@/types/aria'

interface AgentState {
  name: AgentName
  label: string
  model: string
  status: 'idle' | 'running' | 'done' | 'error'
  duration_ms?: number
  output?: Record<string, unknown>
}

const AGENT_DEFS: AgentState[] = [
  { name: 'monitor', label: 'Monitor', model: 'Gemini Flash', status: 'idle' },
  { name: 'triage', label: 'Triage', model: 'Gemini Pro', status: 'idle' },
  { name: 'investigate', label: 'Investigate', model: 'Claude Sonnet', status: 'idle' },
  { name: 'respond', label: 'Respond', model: 'Claude Sonnet', status: 'idle' },
  { name: 'audit', label: 'Audit', model: 'Supabase', status: 'idle' }
]

interface Props {
  incidentId: string | null
  onThought: (agent: AgentName, thought: string) => void
  onActions: (actions: unknown[]) => void
}

export default function AgentFlow({ incidentId, onThought, onActions }: Props) {
  const [agents, setAgents] = useState<AgentState[]>(AGENT_DEFS.map(a => ({ ...a })))
  const [streamId, setStreamId] = useState<string | null>(null)

  useEffect(() => {
    if (!incidentId) {
      setAgents(AGENT_DEFS.map(a => ({ ...a })))
      return
    }

    setAgents(AGENT_DEFS.map(a => ({ ...a })))

    if (streamId === incidentId) return
    setStreamId(incidentId)

    const es = new EventSource(`/api/stream?incident_id=${incidentId}`)
    es.onmessage = (e) => {
      const event = JSON.parse(e.data)
      const { agent, status, duration_ms, thought, output } = event

      if (agent === 'system') {
        es.close()
        if (output?.actions) onActions(output.actions as unknown[])
        return
      }

      setAgents(prev => prev.map(a => {
        if (a.name !== agent) return a
        const next = { ...a, status, duration_ms }
        if (thought) {
          next.output = output
          onThought(agent, thought)
        }
        if (status === 'done' && output) {
          next.output = output
          if (agent === 'respond' && Array.isArray((output as {actions?: unknown[]}).actions)) {
            onActions((output as {actions: unknown[]}).actions)
          }
        }
        return next
      }))

      if (thought) onThought(agent, thought)
    }
    es.onerror = () => es.close()

    // Also poll agent_runs from Supabase for resilience
    const supabase = createClient()
    const channel = supabase
      .channel(`agent-runs-${incidentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'agent_runs',
        filter: `incident_id=eq.${incidentId}`
      }, payload => {
        const run = payload.new as { agent_name: AgentName; status: string; duration_ms?: number; chain_of_thought?: string; output?: Record<string, unknown> }
        setAgents(prev => prev.map(a => {
          if (a.name !== run.agent_name) return a
          const next = { ...a, status: run.status as AgentState['status'], duration_ms: run.duration_ms }
          if (run.chain_of_thought) onThought(run.agent_name, run.chain_of_thought)
          if (run.output) next.output = run.output
          return next
        }))
      })
      .subscribe()

    return () => {
      es.close()
      supabase.removeChannel(channel)
    }
  }, [incidentId])

  function statusIcon(s: AgentState['status']) {
    if (s === 'idle') return <span style={{ color: '#374151', fontSize: 16 }}>○</span>
    if (s === 'running') return <span style={{ color: '#6366f1', fontSize: 14 }} className="agent-active">⟳</span>
    if (s === 'done') return <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
    return <span style={{ color: '#ef4444', fontSize: 14 }}>✗</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {agents.map((agent, i) => (
        <div
          key={agent.name}
          style={{
            padding: '12px 14px',
            background: agent.status === 'running' ? '#1a1a2e' : '#111118',
            border: `1px solid ${agent.status === 'running' ? '#6366f1' : agent.status === 'done' ? '#1e3a2f' : '#1a1a24'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.2s'
          }}
          className={agent.status === 'running' ? 'agent-active' : ''}
        >
          <span style={{ color: '#374151', fontSize: 12, minWidth: 16 }}>{i + 1}</span>
          {statusIcon(agent.status)}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: agent.status === 'running' ? '#a5b4fc' : '#e2e8f0' }}>
                {agent.label}
              </span>
              {agent.duration_ms && (
                <span style={{ fontSize: 11, color: '#22c55e', fontFamily: 'monospace' }}>
                  {(agent.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563' }}>{agent.model}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
