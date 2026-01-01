import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateEmbedding } from '@/lib/gemini'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file from form
    const formData = await request.formData()
    const file = formData.get('resume') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')

    // Use Gemini to read PDF and extract skills directly
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `Read this resume PDF and extract:
1. All the text content
2. A list of technical and professional skills

Return your response as JSON in this exact format (no markdown, just JSON):
{
  "resumeText": "full text of the resume",
  "skills": ["Python", "React", "Machine Learning", "etc"]
}`

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      },
      prompt
    ])

    const text = result.response.text()
    
    // Clean up response and parse JSON
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(jsonText)

    // Generate embedding from resume text
    const embedding = await generateEmbedding(data.resumeText)

    // Return extracted data
    return NextResponse.json({
      success: true,
      resumeText: data.resumeText,
      skills: data.skills,
      embedding
    })

  } catch (error) {
    console.error('Resume processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}