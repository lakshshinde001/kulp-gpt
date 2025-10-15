import { create } from 'zustand'
import { useUserStore } from './userStore'

interface Message {
  id: number
  userId: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  duration?: string // thinking duration in seconds
  reasoningComplete?: boolean // whether reasoning phase is complete
  createdAt: string
}

interface Conversation {
  id: number
  title: string
  createdAt: string
}

interface ChatState {
  messages: Message[]
  conversations: Conversation[]
  input: string
  currentConversationId: number | null
  isLoading: boolean
  sidebarOpen: boolean


  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setConversations: (conversations: Conversation[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: number, message: Message) => void
  removeMessage: (id: number) => void
  setInput: (input: string) => void
  setCurrentConversationId: (id: number | null) => void
  setIsLoading: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void


  sendMessage: (content: string) => Promise<void>
  loadMessages: (conversationId?: number) => Promise<void>
  loadConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<Conversation>
  switchConversation: (conversationId: number) => Promise<void>
}

// Helper function to get current user ID
const getCurrentUserId = () => {
  const user = useUserStore.getState().user
  return user?.id || 1 // fallback to 1 for demo purposes
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversations: [],
  input: '',
  currentConversationId: null, 
  isLoading: false,
  sidebarOpen: false,

  setMessages: (messages) => set((state) => ({
    messages: typeof messages === 'function' ? messages(state.messages) : messages
  })),

  setConversations: (conversations) => set({ conversations }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  updateMessage: (id, message) => set((state) => ({
    messages: state.messages.map(msg => msg.id === id ? message : msg)
  })),

  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== id)
  })),

  setInput: (input) => set({ input }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  sendMessage: async (content: string) => {
    const {
      currentConversationId,
      addMessage,
      updateMessage,
      removeMessage,
      setInput,
      setIsLoading,
      createConversation,
      setCurrentConversationId,
    } = get();
  
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
  
    // temporary user message
    const tempMessage: Message = {
      id: Date.now() * -1,
      userId,
      conversationId: activeConversationId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
  
    addMessage(tempMessage);
    setInput("");
    setIsLoading(true);
  
    try {
      // save user message in DB
      const userResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: activeConversationId,
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
          conversationId: activeConversationId,
          userId,
        }),
      });
  
      if (!aiResponse.ok || !aiResponse.body) throw new Error("AI response failed");
  

      // Create a placeholder assistant message
      const aiMessageId = Date.now();
      const assistantMessage: Message = {
        id: aiMessageId,
        userId: userId,
        conversationId: activeConversationId,
        role: "assistant",
        content: "",
        reasoning: "",
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

      // Reload messages to get duration from database
      setTimeout(() => {
        get().loadMessages(activeConversationId);
      }, 100);
    } catch (error) {
      console.error("Error in chat flow:", error);
      removeMessage(tempMessage.id);
    } finally {
      setIsLoading(false);
    }
  },
  

  loadMessages: async (conversationId) => {
    const { setMessages, setIsLoading } = get()
    const targetConversationId = conversationId || get().currentConversationId

    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages?conversationId=${targetConversationId}`)

      if (response.ok) {
        const rawMessages = await response.json()
        // Convert duration from milliseconds to seconds and format as string
        const processedMessages = rawMessages.map((msg: any) => ({
          ...msg,
          duration: msg.duration ? `${Math.round((msg.duration / 1000) * 10) / 10}s` : undefined
        }))
        setMessages(processedMessages)
      } else {
        console.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  },

  loadConversations: async () => {
    const { setConversations, setIsLoading } = get()
    const userId = getCurrentUserId()

    setIsLoading(true)
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`)

      if (response.ok) {
        const conversations = await response.json()

        setConversations(conversations)
      } else {
        console.error('Failed to load conversations')
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  },

  createConversation: async (title) => {
    const { setConversations, conversations } = get()
    const userId = getCurrentUserId()

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, userId }),
      })

      if (response.ok) {
        const newConversation = await response.json()
        setConversations([...conversations, newConversation])
        return newConversation
      } else {
        throw new Error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  },

  switchConversation: async (conversationId) => {
    const { setCurrentConversationId, loadMessages } = get()

    setCurrentConversationId(conversationId)
    await loadMessages(conversationId)
  },
}))
