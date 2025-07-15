// src/lib/connections.ts
export type ConnectionStatus = 'online' | 'offline' | 'warning' | 'testing'

export interface ServiceStatus {
  influxdb: ConnectionStatus
  mqtt: ConnectionStatus
  grafana: ConnectionStatus
  nodered: ConnectionStatus
  nginx: ConnectionStatus
}

// Test InfluxDB connection
export async function testInfluxDB(): Promise<ConnectionStatus> {
  try {
    const response = await fetch('/api/test/influxdb', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      return 'online'
    } else if (response.status >= 500) {
      return 'offline'
    } else {
      return 'warning'
    }
  } catch (error) {
    console.error('InfluxDB test failed:', error)
    return 'offline'
  }
}

// Test MQTT connection via WebSocket
export async function testMQTT(): Promise<ConnectionStatus> {
  try {
    const response = await fetch('/api/test/mqtt', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    return response.ok ? 'online' : 'offline'
  } catch (error) {
    console.error('MQTT test failed:', error)
    return 'offline'
  }
}

// Test Grafana
export async function testGrafana(): Promise<ConnectionStatus> {
  try {
    const response = await fetch('/api/test/grafana', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      return 'online'
    } else if (response.status >= 500) {
      return 'offline'
    } else {
      return 'warning'
    }
  } catch (error) {
    console.error('Grafana test failed:', error)
    return 'offline'
  }
}

// Test Node-RED
export async function testNodeRED(): Promise<ConnectionStatus> {
  try {
    const response = await fetch('/api/test/nodered', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      return 'online'
    } else if (response.status >= 500) {
      return 'offline'
    } else {
      return 'warning'
    }
  } catch (error) {
    console.error('Node-RED test failed:', error)
    return 'offline'
  }
}

// Test Nginx
export async function testNginx(): Promise<ConnectionStatus> {
  try {
    const response = await fetch('/api/test/nginx', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      return 'online'
    } else if (response.status >= 500) {
      return 'offline'
    } else {
      return 'warning'
    }
  } catch (error) {
    console.error('Nginx test failed:', error)
    return 'offline'
  }
}

// Test tutti i servizi
export async function testAllConnections(): Promise<ServiceStatus> {
  const [influxdb, mqtt, grafana, nodered, nginx] = await Promise.allSettled([
    testInfluxDB(),
    testMQTT(), 
    testGrafana(),
    testNodeRED(),
    testNginx()
  ])

  return {
    influxdb: influxdb.status === 'fulfilled' ? influxdb.value : 'offline',
    mqtt: mqtt.status === 'fulfilled' ? mqtt.value : 'offline',
    grafana: grafana.status === 'fulfilled' ? grafana.value : 'offline',
    nodered: nodered.status === 'fulfilled' ? nodered.value : 'offline',
    nginx: nginx.status === 'fulfilled' ? nginx.value : 'offline',
  }
}