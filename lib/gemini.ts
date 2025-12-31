import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

// Analyze job posting
export async function analyzeJob(jobDescription: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  
  const prompt = `Extract structured information from this job posting.
Return ONLY valid JSON with these fields:
- skills: array of required skills
- experience_level: "entry" or "mid" or "senior"
- h1b_likely: boolean (true if mentions sponsorship or "all qualified candidates")

Job Description:
${jobDescription}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  
  // Clean up markdown code blocks if present
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonText)
}