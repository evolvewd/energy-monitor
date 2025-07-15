// src/app/api/test/influxdb/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connessione InfluxDB
    const influxUrl = process.env.NEXT_PUBLIC_INFLUX_URL || 'http://localhost:8086'
    const token = process.env.NEXT_PUBLIC_INFLUX_TOKEN || 'energy-monitor-super-secret-token-change-this'
    const org = process.env.NEXT_PUBLIC_INFLUX_ORG || 'assistec'
    
    // Test di ping a InfluxDB
    const response = await fetch(`${influxUrl}/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      // Test più specifico - prova a fare una query
      const queryResponse = await fetch(`${influxUrl}/api/v2/query?org=${org}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/vnd.flux',
          'Accept': 'application/csv',
        },
        body: `from(bucket: "energy_data") |> range(start: -1m) |> limit(n: 1)`
      })

      const status = queryResponse.ok ? 'online' : 'warning'
      
      return NextResponse.json({
        status,
        message: queryResponse.ok ? 'InfluxDB connected and queryable' : 'InfluxDB connected but query failed',
        details: {
          ping: response.status,
          query: queryResponse.status,
          url: influxUrl,
          org
        }
      })
    } else {
      return NextResponse.json({
        status: 'offline',
        message: 'InfluxDB ping failed',
        details: {
          ping: response.status,
          url: influxUrl
        }
      }, { status: 503 })
    }
  } catch (error) {
    console.error('InfluxDB connection test failed:', error)
    return NextResponse.json({
      status: 'offline',
      message: 'InfluxDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}