import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Model priority order — 2.5-flash has separate free-tier quota from 2.0-flash
const FLASH_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
const PRO_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']

async function callWithFallback(models: string[], prompt: string): Promise<string> {
  let lastErr: unknown
  for (const model of models) {
    try {
      const gm = genAI.getGenerativeModel({ model })
      const result = await gm.generateContent(prompt)
      return result.response.text()
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? ''
      const isQuotaOrRate = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')
      lastErr = e
      if (!isQuotaOrRate) throw e
      // quota/rate → try next model
    }
  }
  throw lastErr
}

export async function callGeminiFlash(prompt: string): Promise<string> {
  return callWithFallback(FLASH_MODELS, prompt)
}

export async function callGeminiPro(prompt: string): Promise<string> {
  return callWithFallback(PRO_MODELS, prompt)
}
