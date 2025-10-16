import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { smoothStream, stepCountIs, streamText, type CoreMessage } from 'ai';
import { getCurrentTime } from '@/tools/tool.service';
import { mcpToolsFromSmithery } from '@/lib/mcp';
import { z } from 'zod';
import { systemPrompt } from '@/lib/prompts';
import { db } from '@/src/db/client';
import { eq, desc } from 'drizzle-orm';
import { messages } from '@/src/db/schema';



const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY!,
});


export async function POST(req: Request) {
  const { message : userMessage, conversationId, userId } = await req.json();

  // Initialize MCP client
  const mcpClient = await mcpToolsFromSmithery();

  

  // Local tools
  const localTools = {
    get_current_time: {
      description: 'Returns the current UTC date and time as a string.',
      inputSchema: z.object({}), // no input params
      execute: async () => await getCurrentTime(),
    },
  };

  // Merge MCP tools with local tools
  const allTools = {
    ...mcpClient.tools,
    ...localTools,
  };

  const model = openrouter.chat('google/gemini-2.5-flash-001:free', {
    usage: {
      include: true,
    },
    reasoning: {
      enabled: true,
      effort: "medium",
    },
  });



  try {
    const result = await streamText({
      model,
      messages: await buildUserMessage(userMessage, conversationId),
      tools: allTools,
      onError: async (error) => {
        console.log("error", error);
        await mcpClient.close();
      },
      stopWhen: stepCountIs(5),
      onStepFinish: async (message) => {
        console.log("Streaming step finished");
      },
      onFinish: async (message) => {
        console.log("Streaming finished");
        await mcpClient.close();
      },
      experimental_transform : smoothStream({
        chunking : "word",
        delayInMs : 50,
      }),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat flow:", error);
    await mcpClient.close();
    throw error;
  }
}



const buildUserMessage = async (userMessage: string, conversationId: string): Promise<CoreMessage[]> => {
  try {
    const messageHistory: CoreMessage[] = []
    messageHistory.push({ role: 'system', content: systemPrompt })

    // Fetch last 6 messages from conversation history (will use 5, excluding the latest)
    try {
      console.log('Fetching past messages for conversationId:', conversationId);
      const pastMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(6)

      // Remove the latest message (most recent) from past messages
      const filteredPastMessages = pastMessages.slice(1);

      console.log('Found past messages (excluding latest):', filteredPastMessages.length);

      // Format past conversations
      if (filteredPastMessages.length > 0) {
        const pastConversationsText = filteredPastMessages
          .reverse() // Reverse to get chronological order (oldest first)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n\n')

        messageHistory.push({
          role: 'user',
          content: `<past_conversations>\n${pastConversationsText}\n</past_conversations>`
        })
        console.log('Added past conversations to message history');
      }
    } catch (dbError) {
      console.error('Error fetching past messages from database:', dbError)
      // Continue without past messages if DB fails
    }

    // Add current message
    messageHistory.push({
      role: 'user',
      content: `<current_msg>\n${userMessage}\n</current_msg>`
    })

    return messageHistory;
  } catch (error) {
    console.error('Error building user message:', error)
    // Return minimal message history with just system prompt and current message
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `<current_msg>\n${userMessage}\n</current_msg>` }
    ];
  }
}