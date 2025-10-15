import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { stepCountIs, streamText } from 'ai';
import { getCurrentTime } from '@/tools/tool.service';
import { mcpToolsFromSmithery } from '@/lib/mcp';
import { z } from 'zod';
import { systemPrompt } from '@/lib/prompts';



const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY!,
});


export async function POST(req: Request) {
  const { message, conversationId, userId } = await req.json();

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

  const model = openrouter.chat('google/gemini-2.0-flash-lite-001', {
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
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
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat flow:", error);
    await mcpClient.close();
    throw error;
  }
}

