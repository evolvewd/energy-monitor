// src/app/api/influx/latest/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const influxUrl = process.env.NEXT_PUBLIC_INFLUX_URL || 'http://localhost:8086'
    const token = process.env.NEXT_PUBLIC_INFLUX_TOKEN || 'energy-monitor-super-secret-token-change-this'
    const org = process.env.NEXT_PUBLIC_INFLUX_ORG || 'assistec'
    const bucket = process.env.NEXT_PUBLIC_INFLUX_BUCKET || 'energy_data'

    // Query Flux semplificata per ottenere tutti i sensor types disponibili
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r["_measurement"] == "energy_data")
        |> filter(fn: (r) => r["device"] == "finder_6m")
        |> filter(fn: (r) => r["_field"] == "value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 300)
    `

    console.log('Executing enhanced Flux query')

    const response = await fetch(`${influxUrl}/api/v2/query?org=${org}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv',
      },
      body: fluxQuery
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('InfluxDB Query Error:', response.status, errorText)
      return NextResponse.json({
        error: `InfluxDB query failed: ${response.status} - ${errorText}`,
        status: 'error'
      }, { status: response.status })
    }

    const csvData = await response.text()
    console.log('CSV Response length:', csvData.length)

    // Parse CSV response with better handling
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) {
      return NextResponse.json({
        data: [],
        grouped: {},
        latest: {},
        message: 'No data found in the last 24 hours',
        rawCsv: csvData.substring(0, 500) // Debug info
      })
    }

    // Parse CSV headers and log them
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    console.log('CSV Headers:', headers)
    
    const data = []

    // Parse data rows (skip header and empty lines)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      const values = line.split(',').map(v => v.replace(/"/g, '').trim())
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        // Convert _value to number if possible
        if (row._value && !isNaN(parseFloat(row._value))) {
          row._value = parseFloat(row._value)
        }

        // Debug: log first few rows to see structure
        if (data.length < 3) {
          console.log(`Row ${i}:`, row)
        }

        data.push(row)
      }
    }

    // Group data by sensor_type for summary cards
    const grouped: { [key: string]: any } = {}
    const latest: { [key: string]: any } = {}
    
    data.forEach(point => {
      const sensorType = point.sensor_type
      if (!grouped[sensorType]) {
        grouped[sensorType] = {
          latest: point,
          count: 0,
          values: [],
          min: point._value,
          max: point._value,
          avg: 0
        }
        latest[sensorType] = point
      }
      
      grouped[sensorType].count++
      grouped[sensorType].values.push(point)
      
      // Stats
      grouped[sensorType].min = Math.min(grouped[sensorType].min, point._value)
      grouped[sensorType].max = Math.max(grouped[sensorType].max, point._value)
      
      // Keep the latest (first in sorted desc order)
      if (new Date(point._time) > new Date(grouped[sensorType].latest._time)) {
        grouped[sensorType].latest = point
        latest[sensorType] = point
      }
    })

    // Calculate averages
    Object.keys(grouped).forEach(sensorType => {
      const values = grouped[sensorType].values.map((v: any) => v._value)
      grouped[sensorType].avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
    })

    console.log('Parsed data points:', data.length)
    console.log('Sensor types found:', Object.keys(grouped))

    return NextResponse.json({
      data: data.slice(0, 100), // Limit per performance
      grouped,
      latest,
      debug: {
        csvHeaders: headers,
        firstRow: data[0] || null,
        csvPreview: csvData.substring(0, 300)
      },
      stats: {
        totalPoints: data.length,
        sensors: Object.keys(grouped),
        timeRange: data.length > 0 ? {
          oldest: data[data.length - 1]._time,
          newest: data[0]._time
        } : null,
        deviceInfo: {
          device: data[0]?.device || 'unknown',
          measurement: data[0]?._measurement || 'unknown'
        }
      },
      status: 'success'
    })

  } catch (error) {
    console.error('InfluxDB API Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 })
  }
}