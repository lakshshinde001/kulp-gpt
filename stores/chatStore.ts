import { create } from 'zustand'
import { useUserStore } from './userStore'
import { sendMessage } from '../functions/sendMessage'

// Helper function to get current user ID
const getCurrentUserId = () => {
  const user = useUserStore.getState().user
  return user?.id || 1 // fallback to 1 for demo purposes
}

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
  duration?: string // thinking duration in seconds
  reasoningComplete?: boolean // whether reasoning phase is complete
  toolCalls?: ToolCall[] // tool calls made during response generation
  createdAt: string
}

export type { Message, ToolCall };

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
    const actions = {
      currentConversationId: get().currentConversationId,
      addMessage: get().addMessage,
      updateMessage: get().updateMessage,
      removeMessage: get().removeMessage,
      setInput: get().setInput,
      setIsLoading: get().setIsLoading,
      createConversation: get().createConversation,
      setCurrentConversationId: get().setCurrentConversationId,
      loadMessages: get().loadMessages,
      getCurrentUserId,
    };

    await sendMessage(content, actions);
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
        const processedMessages = rawMessages.map((msg: any) => {
          console.log('Processing message:', msg.id, 'tool_calls field:', msg.tool_calls, 'toolCalls field:', msg.toolCalls);

          let toolCalls;
          try {
            // Check both possible field names (tool_calls from DB, toolCalls from camelCase)
            const toolCallsStr = msg.toolCalls || msg.tool_calls;
            toolCalls = toolCallsStr ? JSON.parse(toolCallsStr) : undefined;
            console.log('Parsed toolCalls for message', msg.id, ':', toolCalls);
          } catch (error) {
            console.error('Error parsing toolCalls for message', msg.id, ':', error);
            toolCalls = undefined;
          }

          return {
            ...msg,
            duration: msg.duration ? `${Math.round((msg.duration / 1000) * 10) / 10}s` : undefined,
            toolCalls
          };
        })
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
