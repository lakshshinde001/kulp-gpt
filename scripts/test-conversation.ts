import { db } from '../src/db/client'
import { conversations } from '../src/db/schema'

async function testConversationCreation() {
  try {
    console.log('Testing conversation creation...')

    const conversationData = {
      userId: 1, // Demo user ID
      title: 'Test Conversation',
    }

    console.log('Inserting:', conversationData)

    const result = await db.insert(conversations).values(conversationData).returning()
    console.log('Success! Created conversation:', result[0])

    // Check all conversations
    const allConversations = await db.select().from(conversations)
    console.log('All conversations:', allConversations)

  } catch (error) {
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
  }
}

testConversationCreation()
