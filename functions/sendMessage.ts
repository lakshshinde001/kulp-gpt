import { useUserStore } from '../stores/userStore';

interface ToolCall {
  id: string
  name: string
  input?: any
  output?: any
  status: 'input' | 'output' | 'completed'
}

interface Message {
  id: number
  userId: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  duration?: string
  reasoningComplete?: boolean
  toolCalls?: ToolCall[]
  createdAt: string
}

interface ChatActions {
  currentConversationId: number | null
  addMessage: (message: Message) => void
  updateMessage: (id: number, message: Message) => void
  removeMessage: (id: number) => void
  setInput: (input: string) => void
  setIsLoading: (loading: boolean) => void
  createConversation: (title?: string) => Promise<any>
  updateConversationTitle: (conversationId: number, title: string) => Promise<void>
  setCurrentConversationId: (id: number | null) => void
  loadMessages: (conversationId?: number) => Promise<void>
  getCurrentUserId: () => number
}


export const sendMessage = async (
  content: string,
  actions: ChatActions
) => {
  const {
    currentConversationId,
    addMessage,
    updateMessage,
    removeMessage,
    setInput,
    setIsLoading,
    createConversation,
    setCurrentConversationId,
    loadMessages,
    getCurrentUserId,
  } = actions;

  let activeConversationId = currentConversationId;
  if (!activeConversationId) {
    try {
      const newConversation = await createConversation(`Chat ${new Date().toLocaleString()}`);
      activeConversationId = newConversation.id;
      setCurrentConversationId(activeConversationId);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return;
    }
  }

  const userId = getCurrentUserId();

  // temporary user message with unique ID
  const tempMessage: Message = {
    id: -(Date.now() + Math.random()),
    userId,
    conversationId: activeConversationId!,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };

  addMessage(tempMessage);
  setIsLoading(true);

  try {
    // save user message in DB
    const userResponse = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: activeConversationId!,
          role: "user",
          content,
        }),
    });

    if (!userResponse.ok) throw new Error("Failed to save message");
    const savedUserMessage = await userResponse.json();
    updateMessage(tempMessage.id, savedUserMessage);

    // now get AI response stream
    const aiResponse = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId: activeConversationId!,
          userId,
        }),
    });

    if (!aiResponse.ok || !aiResponse.body) throw new Error("AI response failed");


    // Create a placeholder assistant message with unique ID
    const aiMessageId = Date.now() + Math.random();
    const assistantMessage: Message = {
      id: aiMessageId,
      userId: userId,
      conversationId: activeConversationId!,
      role: "assistant",
      content: "",
      reasoning: "",
      toolCalls: [],
      createdAt: new Date().toISOString(),
    };

    addMessage(assistantMessage);

    // stream the structured response
    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';
    let updateTimeout: NodeJS.Timeout | null = null;

    // Function to batch updates
    const scheduleUpdate = () => {
      if (updateTimeout) return; // Already scheduled
      updateTimeout = setTimeout(() => {
        updateMessage(aiMessageId, { ...assistantMessage });
        updateTimeout = null;
      }, 50); // Update every 50ms max
    };

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        let hasUpdates = false;

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix

                if (data.type === 'text-delta' && data.delta) {
                  assistantMessage.content += data.delta;
                  hasUpdates = true;
                } else if (data.type === 'reasoning-delta' && data.delta) {
                  assistantMessage.reasoning = (assistantMessage.reasoning || "") + data.delta;
                  hasUpdates = true;
                } else if (data.type === 'reasoning-end') {
                  assistantMessage.reasoningComplete = true;
                  hasUpdates = true;
                } else if (data.type === 'tool-input-start') {
                  // Initialize new tool call
                  assistantMessage.toolCalls = assistantMessage.toolCalls || [];
                  assistantMessage.toolCalls.push({
                    id: data.toolCallId,
                    name: data.toolName,
                    status: 'input'
                  });
                  hasUpdates = true;
                } else if (data.type === 'tool-input-available') {
                  // Update tool call with input
                  const toolCall = assistantMessage.toolCalls?.find(tc => tc.id === data.toolCallId);
                  if (toolCall) {
                    toolCall.input = data.input;
                    toolCall.status = 'output';
                  }
                  hasUpdates = true;
                } else if (data.type === 'tool-output-available') {
                  // Update tool call with output
                  const toolCall = assistantMessage.toolCalls?.find(tc => tc.id === data.toolCallId);
                  if (toolCall) {
                    toolCall.output = data.output;
                    toolCall.status = 'completed';
                  }
                  hasUpdates = true;
                }
              // Handle other event types if needed (start, end, etc.)
            } catch (error) {
              console.error('Error parsing stream data:', error, line);
            }
          }
        }

        if (hasUpdates) {
          scheduleUpdate();
        }
      }
    }

    // Final update to ensure all data is rendered
  if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    updateMessage(aiMessageId, { ...assistantMessage });

    // Save the complete assistant message with tool calls to database
    setTimeout(async () => {
      try {
        const messageToSave = {
          userId,
          conversationId: activeConversationId!,
          role: "assistant" as const,
          content: assistantMessage.content,
          reasoning: assistantMessage.reasoning || null,
          toolCalls: assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0 ? JSON.stringify(assistantMessage.toolCalls) : null,
        };

        const saveResponse = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageToSave),
        });

        if (saveResponse.ok) {
          const savedMessage = await saveResponse.json();
          // Update the temporary message with the saved message data
          updateMessage(aiMessageId, {
            ...savedMessage,
            toolCalls: assistantMessage.toolCalls, // Keep the parsed tool calls for immediate display
          });
        }
      } catch (error) {
        console.error("Error saving assistant message:", error);
      }
    }, 200); // Wait for API to finish saving first

  } catch (error) {
    console.error("Error in chat flow:", error);
    removeMessage(tempMessage.id);
  } finally {
    setIsLoading(false);
  }
};
