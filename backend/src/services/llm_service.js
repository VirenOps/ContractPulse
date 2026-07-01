import { Ollama } from 'ollama'

const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`
  }
})

export const runLLMParser = async (text, regexHints = {}) => {
  const prompt = `
You are a contract analysis expert. Extract structured data from the contract text below.
Return ONLY valid JSON. No explanation, no markdown, no code blocks, no backticks.

Hints already extracted via regex (incorporate these, don't contradict them):
${JSON.stringify(regexHints)}

Return exactly this JSON structure (use null for missing fields):
{
  "title": "string — name or subject of this contract",
  "vendorName": "string — the other party's name",
  "contractType": "one of: NDA | SLA | vendor | client | lease | other",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "autoRenews": true or false,
  "noticeRequiredDays": number or null,
  "totalValue": number only, no currency symbols, or null,
  "currency": "INR or USD etc"
}

Contract text:
${text.slice(0, 6000)}
`

  const response = await ollama.chat({
    model: 'gemma4:31b',  // changed from llama3.1
    messages: [{ role: 'user', content: prompt }],
    format: 'json'
  })
  const raw = response.message.content.trim()

  try {
    return JSON.parse(raw)
  } catch {
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned)
  }
}