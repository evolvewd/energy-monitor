// src/app/api/test/grafana/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connessione Grafana via server-side (evita CORS)
    const grafanaUrl = 'http://localhost:3001'
    
    // Test endpoint di health di Grafana
    const response = await fetch(`${grafanaUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Server-side fetch, no CORS issues
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'online',
        message: 'Grafana is healthy',
        details: {
          url: grafanaUrl,
          health: data,
          httpStatus: response.status
        }
      })
    } else {
      return NextResponse.json({
        status: 'warning',
        message: `Grafana responded with status ${response.status}`,
        details: {
          url: grafanaUrl,
          httpStatus: response.status
        }
      })
    }
  } catch (error) {
    console.error('Grafana connection test failed:', error)
    
    // Se è un errore di connessione, Grafana è probabilmente offline
    if (error instanceof Error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('fetch failed')
    )) {
      return NextResponse.json({
        status: 'offline',
        message: 'Grafana is not responding',
        error: 'Connection refused'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      status: 'offline',
      message: 'Grafana test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}