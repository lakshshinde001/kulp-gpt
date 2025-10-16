import { create } from 'zustand'
import { useUserStore } from './userStore'
import { sendMessage } from '../functions/sendMessage'
import { devtools } from 'zustand/middleware'
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
  messages?: Message[]
}

interface ChatState {
  messages: Message[]
  conversations: Conversation[]
  input: string
  currentConversationId: number | null
  isLoading: boolean
  isCreatingConversation: boolean
  sidebarOpen: boolean


  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setConversations: (conversations: Conversation[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: number, message: Message) => void
  removeMessage: (id: number) => void
  setInput: (input: string) => void
  setCurrentConversationId: (id: number | null) => void
  setIsLoading: (loading: boolean) => void
  setIsCreatingConversation: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void


  sendMessage: (content: string) => Promise<void>
  loadConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<Conversation>
  updateConversationTitle: (conversationId: number, title: string) => Promise<void>
  switchConversation: (conversationId: number) => Promise<void>
}


export const useChatStore = create<ChatState>()(devtools((set, get) => ({
  messages: [],
  conversations: [],
  input: '',
  currentConversationId: null,
  isLoading: false,
  isCreatingConversation: false,
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
  setIsCreatingConversation: (isCreating) => set({ isCreatingConversation: isCreating }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  sendMessage: async (content: string) => {
    const actions = {
      currentConversationId: get().currentConversationId,
      addMessage: async (message: Message) => {
        // Update conversation messages when adding new message
        const { conversations, currentConversationId, setConversations, updateConversationTitle } = get()
        if (currentConversationId) {
          const updatedConversations = conversations.map(conv =>
            conv.id === currentConversationId
              ? { ...conv, messages: [...(conv.messages || []), message] }
              : conv
          )
          setConversations(updatedConversations)

          // Update conversation title if this is the first user message and title is still default
          const currentConversation = conversations.find(c => c.id === currentConversationId)
          if (message.role === 'user' &&
              currentConversation &&
              (currentConversation.title === 'New Chat' || currentConversation.title === 'New Conversation')) {
            // Truncate the message content for the title (max 50 characters)
            const title = message.content.length > 50
              ? message.content.substring(0, 50) + '...'
              : message.content
            try {
              await updateConversationTitle(currentConversationId, title)
            } catch (error) {
              console.error('Failed to update conversation title:', error)
              // Don't throw - message was sent successfully even if title update failed
            }
          }
        }
        get().addMessage(message)
      },
      updateMessage: get().updateMessage,
      removeMessage: get().removeMessage,
      setInput: get().setInput,
      setIsLoading: get().setIsLoading,
      createConversation: get().createConversation,
      setCurrentConversationId: get().setCurrentConversationId,
      updateConversationTitle: get().updateConversationTitle,
      loadMessages: async () => {}, // Dummy function for compatibility
      getCurrentUserId,
    };

    await sendMessage(content, actions);
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
    const { setConversations, conversations, setIsCreatingConversation } = get()
    const userId = getCurrentUserId()

    setIsCreatingConversation(true)
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
    } finally {
      setIsCreatingConversation(false)
    }
  },

  updateConversationTitle: async (conversationId, title) => {
    const { conversations, setConversations } = get()

    try {
      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversationId, title }),
      })

      if (response.ok) {
        // Update the conversation title in the local state
        const updatedConversations = conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, title }
            : conv
        )
        setConversations(updatedConversations)
      } else {
        throw new Error('Failed to update conversation title')
      }
    } catch (error) {
      console.error('Error updating conversation title:', error)
      throw error
    }
  },

  switchConversation: async (conversationId) => {
    const { setCurrentConversationId, conversations } = get()

    setCurrentConversationId(conversationId)

    // Find the conversation and set its messages
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation?.messages) {
      get().setMessages(conversation.messages)
    } else {
      // Fallback: if no messages in conversation, set empty array
      get().setMessages([])
    }
  },
})))
