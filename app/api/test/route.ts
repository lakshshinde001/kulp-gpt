import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing API route...')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL value:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    return NextResponse.json({
      success: true,
      message: 'API route working',
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
