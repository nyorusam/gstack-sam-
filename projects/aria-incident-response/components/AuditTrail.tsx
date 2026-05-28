'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuditEntry {
  id: string
  incident_id: string
  event: string
  actor: string
  details: Record<string, unknown>
  created_at: string
}

const ACTOR_COLOR: Record<string, string> = {
  system: '#6b7280',
  monitor: '#10b981',
  triage: '#6366f1',
  investigate: '#8b5cf6',
  respond: '#f59e0b',
  audit: '#22c55e',
  aria: '#6366f1'
}

const EVENT_LABEL: Record<string, string> = {
  incident_ingested: 'Incident ingested',
  monitor_complete: 'Monitor complete',
  triage_complete: 'Triage complete',
  investigation_complete: 'Investigation complete',
  response_plan_generated: 'Response plan generated',
  incident_resolved: 'Incident resolved'
}

function timeStr(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

interface Props {
  incidentId: string | null
}

export default function AuditTrail({ incidentId }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const url = incidentId
        ? `/api/audit?incident_id=${incidentId}`
        : '/api/audit'
      const res = await fetch(url)
      const data = await res.json()
      setEntries(Array.isArray(data) ? data.reverse() : [])
    }
    load()

    const channel = supabase
      .channel('audit-trail')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'audit_log'
      }, payload => {
        const entry = payload.new as AuditEntry
        if (!incidentId || entry.incident_id === incidentId) {
          setEntries(prev => [...prev, entry])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [incidentId])

  return (
    <div>
      <div style={{
        fontSize: 10, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase',
        fontWeight: 700, marginBottom: 10
      }}>
        Audit Trail {incidentId ? '' : '— Global'}
      </div>
      {entries.length === 0 && (
        <div style={{ color: '#374151', fontSize: 12 }}>No audit events yet.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 70px 1fr',
              gap: 8,
              padding: '6px 0',
              borderBottom: '1px solid #0d0d14',
              alignItems: 'start'
            }}
          >
            <span style={{ fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>
              {timeStr(entry.created_at)}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: ACTOR_COLOR[entry.actor] ?? '#6b7280',
              letterSpacing: 0.5
            }}>
              {entry.actor}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {EVENT_LABEL[entry.event] ?? entry.event}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
