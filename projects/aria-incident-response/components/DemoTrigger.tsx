'use client'

import { useState } from 'react'

interface Props {
  onIncidentCreated: (incidentId: string) => void
}

const SCENARIOS = [
  { key: 'database', label: 'DB Spike', color: '#ef4444', desc: 'PostgreSQL connection pool exhausted' },
  { key: 'security', label: 'Auth Attack', color: '#f59e0b', desc: 'Credential stuffing via TOR' },
  { key: 'compliance', label: 'PII Leak', color: '#8b5cf6', desc: 'Unencrypted GDPR data exposed' }
]

export default function DemoTrigger({ onIncidentCreated }: Props) {
  const [firing, setFiring] = useState(false)
  const [active, setActive] = useState('database')

  async function fire() {
    setFiring(true)
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: active })
      })
      const incident = await res.json()
      if (incident.id) {
        onIncidentCreated(incident.id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFiring(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${active === s.key ? s.color : '#2a2a35'}`,
              background: active === s.key ? `${s.color}22` : 'transparent',
              color: active === s.key ? s.color : '#6b7280',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title={s.desc}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        onClick={fire}
        disabled={firing}
        style={{
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          background: firing ? '#4338ca' : '#6366f1',
          color: 'white',
          fontWeight: 600,
          fontSize: 13,
          cursor: firing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'background 0.15s'
        }}
      >
        {firing ? '⟳ Firing...' : '▶ FIRE DEMO'}
      </button>
    </div>
  )
}
