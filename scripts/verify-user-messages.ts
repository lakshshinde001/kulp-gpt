import { db } from '../src/db/client'
import { users, conversations, messages } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function verifyUserMessages() {
  try {
    console.log('=== Verifying User-Message Relationships ===\n')

    // Check users
    const allUsers = await db.select().from(users)
    console.log('Users:', allUsers.length)
    allUsers.forEach(user => console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`))

    // Check conversations
    const allConversations = await db.select().from(conversations)
    console.log('\nConversations:', allConversations.length)
    allConversations.forEach(conv => console.log(`  - ID: ${conv.id}, UserID: ${conv.userId}, Title: ${conv.title}`))

    // Check messages
    const allMessages = await db.select().from(messages)
    console.log('\nMessages:', allMessages.length)
    allMessages.forEach(msg => console.log(`  - ID: ${msg.id}, UserID: ${msg.userId}, ConvID: ${msg.conversationId}, Role: ${msg.role}, Content: "${msg.content.substring(0, 50)}..."`))

    // Verify relationships
    console.log('\n=== Relationship Verification ===')

    const demoUserId = 1
    const userConversations = await db.select().from(conversations).where(eq(conversations.userId, demoUserId))
    console.log(`\nUser ${demoUserId} has ${userConversations.length} conversations`)

    for (const conv of userConversations) {
      const convMessages = await db.select().from(messages).where(eq(messages.conversationId, conv.id))
      console.log(`  Conversation ${conv.id} ("${conv.title}") has ${convMessages.length} messages`)

      // Check that all messages in this conversation belong to the correct user
      const incorrectMessages = convMessages.filter(msg => msg.userId !== demoUserId)
      if (incorrectMessages.length > 0) {
        console.log(`    ❌ Found ${incorrectMessages.length} messages with wrong userId!`)
      } else {
        console.log(`    ✅ All messages correctly linked to user ${demoUserId}`)
      }
    }

    console.log('\n=== Verification Complete ===')

  } catch (error) {
    console.error('Error during verification:', error)
  }
}

verifyUserMessages()
