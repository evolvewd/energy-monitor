// src/app/api/test/nodered/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connessione Node-RED via server-side
    const nodeRedUrl = 'http://localhost:1880'
    
    // Test endpoint admin/settings di Node-RED
    const response = await fetch(`${nodeRedUrl}/settings`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'online',
        message: 'Node-RED is responding',
        details: {
          url: nodeRedUrl,
          version: data.version || 'unknown',
          httpStatus: response.status,
          editorEnabled: data.editorTheme ? true : false
        }
      })
    } else {
      return NextResponse.json({
        status: 'warning',
        message: `Node-RED responded with status ${response.status}`,
        details: {
          url: nodeRedUrl,
          httpStatus: response.status
        }
      })
    }
  } catch (error) {
    console.error('Node-RED connection test failed:', error)
    
    if (error instanceof Error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('fetch failed')
    )) {
      return NextResponse.json({
        status: 'offline',
        message: 'Node-RED is not responding',
        error: 'Connection refused'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      status: 'offline',
      message: 'Node-RED test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}