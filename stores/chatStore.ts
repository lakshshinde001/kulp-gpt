import { create } from 'zustand'

interface Message {
  id: number
  userId: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
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

const DEMO_USER_ID = 1

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
    const { currentConversationId, addMessage, updateMessage, removeMessage, setInput, setIsLoading, createConversation, setCurrentConversationId } = get()


    let activeConversationId = currentConversationId
    if (!activeConversationId) {
      try {
        const newConversation = await createConversation(`Chat ${new Date().toLocaleString()}`)
        activeConversationId = newConversation.id
        setCurrentConversationId(activeConversationId)
      } catch (error) {
        console.error('Failed to create conversation:', error)
        return
      }
    }


    const tempMessage: Message = {
      id: Date.now() * -1,
      userId: DEMO_USER_ID,
      conversationId: activeConversationId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }


    addMessage(tempMessage)
    setInput('')
    setIsLoading(true)

    try {

      const userResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          conversationId: activeConversationId,
          role: 'user',
          content,
        }),
      })

      if (userResponse.ok) {
        const savedUserMessage = await userResponse.json()

        updateMessage(tempMessage.id, savedUserMessage)


        const aiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationId: activeConversationId,
            userId: DEMO_USER_ID,
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()

          addMessage(aiData.message)
        }
      } else {

        removeMessage(tempMessage.id)
      }
    } catch (error) {
      console.error('Error in chat flow:', error)

      removeMessage(tempMessage.id)
    } finally {
      setIsLoading(false)
    }
  },

  loadMessages: async (conversationId) => {
    const { setMessages, setIsLoading } = get()
    const targetConversationId = conversationId || get().currentConversationId

    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages?conversationId=${targetConversationId}`)

      if (response.ok) {
        const messages = await response.json()
        setMessages(messages)
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

    setIsLoading(true)
    try {
      const response = await fetch(`/api/conversations?userId=${DEMO_USER_ID}`)

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

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, userId: DEMO_USER_ID }),
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
