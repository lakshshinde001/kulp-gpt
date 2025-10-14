import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { conversations } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, userId } = body;

    console.log('Creating conversation with:', { title, userId });

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const conversationData = {
      userId: Number(userId),
      title: title || 'New Conversation',
    };

    console.log('Inserting conversation data:', conversationData);

    const newConversation = await db.insert(conversations).values(conversationData).returning();

    console.log('Created conversation:', newConversation[0]);

    return NextResponse.json(newConversation[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      error: 'Failed to create conversation',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, Number(userId)))
      .orderBy(conversations.createdAt);

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}