import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { runPipeline } from '@/lib/orchestrator'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { incident_id } = await req.json()
    if (!incident_id) return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 })

    const supabase = createServerClient()
    const { data: incident, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', incident_id)
      .single()

    if (error || !incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

    // Fire and forget — the SSE endpoint streams progress
    runPipeline(incident, () => {}).catch(console.error)

    return NextResponse.json({ started: true, incident_id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
