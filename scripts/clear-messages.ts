import { db } from '../src/db/client'
import { messages } from '../src/db/schema'

async function clearMessages() {
  try {
    console.log('Deleting all existing messages...')
    await db.delete(messages)
    console.log('All messages deleted successfully')
  } catch (error) {
    console.error('Error deleting messages:', error)
  }
}

clearMessages()
