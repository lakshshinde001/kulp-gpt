import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText,  } from 'ai';
import { db } from '@/src/db/client';
import { messages } from '@/src/db/schema';




const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY!,
});


export async function POST(req: Request) {
  const { message, conversationId, userId } = await req.json();

   const model =openrouter.chat('z-ai/glm-4.5-air:free', {
    usage: {
      include: true,
    },
    reasoning: {
      enabled: true,
      effort: "medium",
    },
  });

  let reasoningText = "";
  let finalText = "";

  const startTime = Date.now();

  const result = await streamText({
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: message },
    ],
    onChunk: async (chunk) => {
      // Check the type of chunk and accumulate appropriately
      switch (chunk.chunk.type) {
        case 'reasoning-delta':
          // console.log("reasoningText", chunk.chunk.text);
          reasoningText += chunk.chunk.text ?? '';
          break;
        case 'text-delta':
          // console.log("finalText", chunk.chunk.text);
          finalText += chunk.chunk.text ?? '';
          break;
        default:
          break;
      }
    },
    onError: (error) => {
      console.log("error", error);
    },
    onStepFinish: async (message) => {
      const endTime = Date.now();
      const durationMs = endTime - startTime; // duration in milliseconds
      const durationSec = Math.round((durationMs / 1000) * 10) / 10; // duration in seconds, rounded to 1 decimal
      console.log("duration (seconds)", durationSec);

      try {
        const assistantMessage = {
          userId: userId,
          conversationId: conversationId,
          role: "assistant",
          content: finalText,
          reasoning: reasoningText || null,
          duration: durationMs,
        };
        await db.insert(messages).values(assistantMessage);
        console.log("assistantMessage saved", finalText);
      } catch (error) {
        console.log("error", error);
      }
    },

  });

  //save final message in db as assistant message
 


  

  return result.toUIMessageStreamResponse();



}







