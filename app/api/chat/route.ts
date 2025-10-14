import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/src/db/client'
import { messages } from '@/src/db/schema'

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

// Configure Gemini model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId = 1, userId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Generate AI response using Gemini
    const prompt = `You are a helpful AI assistant. Respond to the following message in a friendly and helpful way:

User: ${message}

Assistant:`

    const result = await model.generateContent(prompt)
    const aiResponse = result.response.text()

    // Save AI response to database
    const savedMessage = await db.insert(messages).values({
      userId: Number(userId),
      conversationId: Number(conversationId),
      role: 'assistant',
      content: aiResponse,
    }).returning()

    return NextResponse.json({
      message: savedMessage[0],
      response: aiResponse
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}
