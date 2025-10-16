import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { conversations, messages } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, userId } = body;

    console.log('Creating conversation with:', { title, userId });

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Generate a UUID for the conversation
    const conversationId = crypto.randomUUID();

    const conversationData = {
      id: conversationId,
      userId: Number(userId),
      title: title || 'New Conversation',
    };

    console.log('Inserting conversation data:', conversationData);

    const newConversation = await db.insert(conversations).values(conversationData).returning();

    console.log('Created conversation:', newConversation[0]);

    return NextResponse.json(newConversation[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    console.error('Error details:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    return NextResponse.json({
      error: 'Failed to create conversation',
      details: (error as Error).message
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

    // Get conversations
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, Number(userId)))
      .orderBy(desc(conversations.createdAt));

    // Get messages for each conversation
    const conversationsWithMessages = await Promise.all(
      userConversations.map(async (conversation) => {
        const conversationMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(messages.createdAt);

        // Process messages to include parsed toolCalls
        const processedMessages = conversationMessages.map((msg: any) => {
          let toolCalls;
          try {
            const toolCallsStr = msg.toolCalls || msg.tool_calls;
            toolCalls = toolCallsStr ? JSON.parse(toolCallsStr) : undefined;
          } catch (error) {
            console.error('Error parsing toolCalls for message', msg.id, ':', error);
            toolCalls = undefined;
          }

          return {
            ...msg,
            duration: msg.duration ? `${Math.round((msg.duration / 1000) * 10) / 10}s` : undefined,
            toolCalls
          };
        });

        return {
          ...conversation,
          messages: processedMessages
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
    }

    const updatedConversation = await db
      .update(conversations)
      .set({ title })
      .where(eq(conversations.id, id))
      .returning();

    if (updatedConversation.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(updatedConversation[0]);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}