'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Incident } from '@/types/aria'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#6366f1',
  low: '#22c55e'
}

const STATUS_LABEL: Record<string, string> = {
  open: 'OPEN',
  triaged: 'TRIAGED',
  investigating: 'ACTIVE',
  resolved: 'RESOLVED'
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

interface Props {
  activeId: string | null
  onSelect: (id: string) => void
}

export default function IncidentFeed({ activeId, onSelect }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setIncidents((data ?? []) as Incident[]))

    const channel = supabase
      .channel('incidents-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, payload => {
        if (payload.eventType === 'INSERT') {
          setIncidents(prev => [payload.new as Incident, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setIncidents(prev => prev.map(i => i.id === payload.new.id ? payload.new as Incident : i))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {incidents.length === 0 && (
        <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
          No incidents yet.<br />Fire a demo to begin.
        </div>
      )}
      {incidents.map(inc => {
        const color = SEVERITY_COLOR[inc.severity] ?? '#6b7280'
        const isActive = inc.id === activeId
        return (
          <div
            key={inc.id}
            onClick={() => onSelect(inc.id)}
            style={{
              padding: '12px 14px',
              borderLeft: `3px solid ${isActive ? '#6366f1' : color}`,
              background: isActive ? '#1a1a2e' : 'transparent',
              cursor: 'pointer',
              borderBottom: '1px solid #1a1a24',
              transition: 'background 0.1s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}>
                ● {inc.severity}
              </span>
              <span style={{ fontSize: 10, color: '#4b5563' }}>{timeAgo(inc.created_at)}</span>
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>
              {inc.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{inc.source}</span>
              <span style={{
                fontSize: 10,
                color: inc.status === 'resolved' ? '#22c55e' : inc.status === 'investigating' ? '#6366f1' : '#6b7280',
                fontWeight: 600
              }}>
                {STATUS_LABEL[inc.status] ?? inc.status.toUpperCase()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
