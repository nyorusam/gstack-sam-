import { NextRequest, NextResponse } from 'next/server'

const SCENARIOS = {
  database: {
    type: 'database',
    severity: 'critical',
    source: 'PostgreSQL prod-db-01 (us-east-1)',
    title: 'Connection pool exhausted — 500 active connections',
    raw_data: {
      metric: 'pg_connections',
      current_value: 500,
      threshold: 400,
      duration_seconds: 180,
      affected_queries: ['user_auth', 'order_processing', 'inventory_sync'],
      error_rate_pct: 23.4,
      p99_latency_ms: 8420
    }
  },
  security: {
    type: 'security',
    severity: 'high',
    source: 'API Gateway (prod)',
    title: 'Repeated 401s from unknown IP — potential credential stuffing',
    raw_data: {
      source_ip: '185.220.101.47',
      attempts: 847,
      window_minutes: 5,
      targeted_endpoints: ['/api/auth/login', '/api/users/me'],
      geo: 'TOR exit node',
      user_agents: ['python-requests/2.28', 'curl/7.81'],
      success_rate_pct: 0.2
    }
  },
  compliance: {
    type: 'compliance',
    severity: 'high',
    source: 'DLP Scanner (prod)',
    title: 'PII detected in unencrypted S3 bucket — GDPR exposure',
    raw_data: {
      bucket: 'prod-analytics-exports',
      files_flagged: 14,
      record_types: ['email', 'phone', 'ssn_partial'],
      estimated_records: 48000,
      public_access: true,
      regulations: ['GDPR', 'CCPA'],
      first_detected: new Date().toISOString()
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { scenario = 'database' } = await req.json().catch(() => ({}))
    const incident = SCENARIOS[scenario as keyof typeof SCENARIOS] ?? SCENARIOS.database

    const res = await fetch(`${req.nextUrl.origin}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
