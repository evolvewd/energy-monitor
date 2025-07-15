// src/app/api/test/nginx/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connessione Nginx via server-side
    const nginxUrl = 'http://localhost'
    
    // Simple HEAD request to test if Nginx responds
    const response = await fetch(nginxUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (response.ok) {
      return NextResponse.json({
        status: 'online',
        message: 'Nginx is responding',
        details: {
          url: nginxUrl,
          httpStatus: response.status,
          server: response.headers.get('server') || 'unknown'
        }
      })
    } else {
      return NextResponse.json({
        status: 'warning',
        message: `Nginx responded with status ${response.status}`,
        details: {
          url: nginxUrl,
          httpStatus: response.status
        }
      })
    }
  } catch (error) {
    console.error('Nginx connection test failed:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({
          status: 'offline',
          message: 'Nginx connection timeout',
          error: 'Request timed out after 5 seconds'
        }, { status: 503 })
      }
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json({
          status: 'offline',
          message: 'Nginx is not responding',
          error: 'Connection refused'
        }, { status: 503 })
      }
    }
    
    return NextResponse.json({
      status: 'offline',
      message: 'Nginx test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}