'use client'

import { useState } from 'react'
import DemoTrigger from '@/components/DemoTrigger'
import IncidentFeed from '@/components/IncidentFeed'
import AgentFlow from '@/components/AgentFlow'
import ChainOfThought from '@/components/ChainOfThought'
import AuditTrail from '@/components/AuditTrail'
import type { AgentName } from '@/types/aria'

export default function Dashboard() {
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [chainAgent, setChainAgent] = useState<AgentName | null>(null)
  const [chainThought, setChainThought] = useState<string | null>(null)
  const [actions, setActions] = useState<unknown[]>([])

  function handleIncidentCreated(id: string) {
    setActiveIncidentId(id)
    setChainAgent(null)
    setChainThought(null)
    setActions([])
  }

  function handleThought(agent: AgentName, thought: string) {
    setChainAgent(agent)
    setChainThought(thought)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9' }}>
      {/* Header */}
      <header style={{
        height: 56,
        borderBottom: '1px solid #111118',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#0a0a0f'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 18, fontWeight: 800, color: '#6366f1', letterSpacing: -0.5
          }}>
            ARIA
          </span>
          <span style={{
            fontSize: 11, color: '#4b5563', borderLeft: '1px solid #1a1a24',
            paddingLeft: 10
          }}>
            Autonomous Incident Response Intelligence Agent
          </span>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
            marginLeft: 6, boxShadow: '0 0 6px #22c55e'
          }} />
        </div>
        <DemoTrigger onIncidentCreated={handleIncidentCreated} />
      </header>

      {/* Three-column dashboard */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 1fr',
        gap: 0,
        height: 'calc(100vh - 56px)',
        overflow: 'hidden'
      }}>
        {/* Column 1: Incidents */}
        <div style={{
          borderRight: '1px solid #111118',
          overflowY: 'auto',
          background: '#0a0a0f'
        }}>
          <div style={{
            padding: '14px 14px 8px',
            borderBottom: '1px solid #111118',
            fontSize: 10,
            color: '#4b5563',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            Live Incidents
          </div>
          <IncidentFeed activeId={activeIncidentId} onSelect={setActiveIncidentId} />
        </div>

        {/* Column 2: Agent Pipeline */}
        <div style={{
          borderRight: '1px solid #111118',
          overflowY: 'auto',
          background: '#0a0a0f',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          <div style={{
            fontSize: 10,
            color: '#4b5563',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            Agent Pipeline
          </div>

          <AgentFlow
            incidentId={activeIncidentId}
            onThought={handleThought}
            onActions={setActions}
          />

          {!activeIncidentId && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1f2937', fontSize: 13, textAlign: 'center', lineHeight: 1.8
            }}>
              Select an incident or<br />fire a demo to activate the pipeline
            </div>
          )}
        </div>

        {/* Column 3: Chain of Thought + Audit */}
        <div style={{
          overflowY: 'auto',
          background: '#0a0a0f',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          <ChainOfThought
            agent={chainAgent}
            thought={chainThought}
            actions={actions}
          />
          <div style={{ borderTop: '1px solid #111118', paddingTop: 20 }}>
            <AuditTrail incidentId={activeIncidentId} />
          </div>
        </div>
      </main>
    </div>
  )
}
