import { NextResponse } from "next/server";
import { access } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    // Check if uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await access(uploadsDir)
    
    return NextResponse.json({ 
      status: 'healthy',
      message: 'Good!',
      timestamp: new Date().toISOString(),
      uploads_dir: 'accessible'
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      message: 'uploads directory not accessible',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}