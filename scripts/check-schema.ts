import { db } from '../src/db/client'
import { users, conversations, messages } from '../src/db/schema'

async function checkSchema() {
  try {
    console.log('Checking users table...')
    const allUsers = await db.select().from(users)
    console.log('Users:', allUsers)

    console.log('Checking conversations table...')
    const allConversations = await db.select().from(conversations)
    console.log('Conversations:', allConversations)

    console.log('Checking messages table...')
    const allMessages = await db.select().from(messages).limit(5)
    console.log('Messages (first 5):', allMessages)

  } catch (error) {
    console.error('Error checking schema:', error)
  }
}

checkSchema()
