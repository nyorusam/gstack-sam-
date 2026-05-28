import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { runPipeline, AgentEvent } from '@/lib/orchestrator'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const incidentId = req.nextUrl.searchParams.get('incident_id')
  if (!incidentId) {
    return new Response('Missing incident_id', { status: 400 })
  }

  const supabase = createServerClient()
  const { data: incident, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .single()

  if (error || !incident) {
    return new Response('Incident not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // client disconnected
        }
      }

      try {
        await runPipeline(incident, send)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agent: 'system', status: 'done', model: '' })}\n\n`))
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agent: 'system', status: 'error', model: '', error: String(e) })}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
