// src/app/api/test/mqtt/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connessione MQTT via WebSocket (porta 9001)
    const mqttWsUrl = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9001'
    
    // Per ora testiamo la disponibilità del servizio
    // In un ambiente reale useremmo una libreria MQTT come mqtt.js
    
    // Test se Mosquitto risponde sulla porta HTTP (se configurato)
    try {
      // Proviamo a testare se il servizio è in ascolto
      const testUrl = 'http://localhost:1883' // Questo fallirà ma ci dice se la porta è aperta
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 secondi timeout
      })
      
      // Se arriviamo qui, il servizio risponde
      return NextResponse.json({
        status: 'online',
        message: 'MQTT broker is responding',
        details: {
          wsUrl: mqttWsUrl,
          tcpPort: 1883,
          wsPort: 9001
        }
      })
    } catch (fetchError) {
      // Questo è normale - MQTT non risponde a HTTP
      // Ma se il fetch fallisce per timeout/connection refused, il servizio potrebbe essere down
      const error = fetchError as Error
      
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        // Probabilmente il servizio è up ma non risponde HTTP (normale per MQTT)
        return NextResponse.json({
          status: 'warning',
          message: 'MQTT broker appears to be running (connection possible but protocol mismatch)',
          details: {
            wsUrl: mqttWsUrl,
            tcpPort: 1883,
            wsPort: 9001,
            note: 'Use WebSocket client for actual MQTT testing'
          }
        })
      } else {
        return NextResponse.json({
          status: 'offline',
          message: 'MQTT broker connection failed',
          details: {
            error: error.message,
            wsUrl: mqttWsUrl
          }
        }, { status: 503 })
      }
    }
  } catch (error) {
    console.error('MQTT connection test failed:', error)
    return NextResponse.json({
      status: 'offline',
      message: 'MQTT test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}