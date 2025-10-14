import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { messages } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId, conversationId, role, content } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const newMessage = await db.insert(messages).values({
      userId: Number(userId),
      conversationId: Number(conversationId),
      role,
      content,
    }).returning();

    return NextResponse.json(newMessage[0]);
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }
    
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parseInt(conversationId)))
      .orderBy(messages.createdAt);
    
    return NextResponse.json(conversationMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}