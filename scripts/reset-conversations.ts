import { db } from '../src/db/client'
import { conversations } from '../src/db/schema'

async function resetConversations() {
  try {
    console.log('Deleting all existing conversations...')
    await db.delete(conversations)
    console.log('All conversations deleted successfully')
  } catch (error) {
    console.error('Error deleting conversations:', error)
  }
}

resetConversations()
