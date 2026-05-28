'use client'

import type { AgentName } from '@/types/aria'

interface Props {
  agent: AgentName | null
  thought: string | null
  actions: unknown[]
}

interface Action {
  action_type: string
  priority: string
  title: string
  description: string
  assignee?: string
}

const PRIORITY_COLOR: Record<string, string> = {
  immediate: '#ef4444',
  urgent: '#f59e0b',
  normal: '#6366f1'
}

const ACTION_TYPE_ICON: Record<string, string> = {
  ticket: '🎫',
  notification: '📣',
  runbook: '📋',
  escalation: '🚨'
}

export default function ChainOfThought({ agent, thought, actions }: Props) {
  const steps = thought ? thought.split(/(?=Step \d+:)/i).filter(Boolean) : []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Chain of Thought */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{
          fontSize: 10, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase',
          fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ color: '#6366f1' }}>◈</span>
          Chain of Thought {agent && <span style={{ color: '#6366f1' }}>— {agent}</span>}
        </div>

        {!thought && (
          <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.6 }}>
            Waiting for Investigate agent to activate...
          </div>
        )}

        {steps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 280 }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="stream-token"
                style={{
                  background: '#0d0d14',
                  border: '1px solid #1a1a2e',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#c4cad4',
                  lineHeight: 1.6
                }}
              >
                {step.trim()}
              </div>
            ))}
          </div>
        )}

        {thought && steps.length === 0 && (
          <div style={{
            background: '#0d0d14',
            border: '1px solid #1a1a2e',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            color: '#c4cad4',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
            maxHeight: 280
          }}>
            {thought}
          </div>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase',
            fontWeight: 700, marginBottom: 10
          }}>
            Actions Generated — {actions.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 220 }}>
            {(actions as Action[]).map((action, i) => (
              <div
                key={i}
                style={{
                  background: '#0d0d14',
                  border: `1px solid ${PRIORITY_COLOR[action.priority] ?? '#1a1a24'}33`,
                  borderLeft: `3px solid ${PRIORITY_COLOR[action.priority] ?? '#6366f1'}`,
                  borderRadius: 6,
                  padding: '8px 10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                    {ACTION_TYPE_ICON[action.action_type] ?? '→'} {action.title}
                  </span>
                  <span style={{
                    fontSize: 9, color: PRIORITY_COLOR[action.priority] ?? '#6b7280',
                    textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5
                  }}>
                    {action.priority}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                  {action.description}
                </div>
                {action.assignee && (
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3 }}>
                    → {action.assignee}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
