import { db } from '../src/db/client'
import { users } from '../src/db/schema'

async function seedUser() {
  try {
    // Create a dummy user
    const result = await db.insert(users).values({
      name: 'Demo User',
      email: 'demo@example.com',
    }).returning()

    console.log('Dummy user created:', result[0])
  } catch (error) {
    console.error('Error creating dummy user:', error)
  }
}

seedUser()
