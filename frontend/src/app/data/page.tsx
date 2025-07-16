'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Database, Activity, Zap, Gauge } from 'lucide-react'

interface InfluxDataPoint {
  _time: string
  _value: number
  sensor_type: string
  device: string
  _field: string
  _measurement: string
}

interface GroupedData {
  [sensor_type: string]: {
    latest: InfluxDataPoint
    count: number
    values: InfluxDataPoint[]
    min: number
    max: number
    avg: number
  }
}

interface ApiResponse {
  data: InfluxDataPoint[]
  grouped: GroupedData
  latest: { [key: string]: InfluxDataPoint }
  stats: {
    totalPoints: number
    sensors: string[]
    timeRange: { oldest: string; newest: string } | null
    deviceInfo: { device: string; measurement: string }
  }
}

export default function DataPage() {
  const [data, setData] = useState<InfluxDataPoint[]>([])
  const [groupedData, setGroupedData] = useState<GroupedData>({})
  const [latest, setLatest] = useState<{ [key: string]: InfluxDataPoint }>({})
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/influx/latest')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      setData(result.data || [])
      setGroupedData(result.grouped || {})
      setLatest(result.latest || {})
      setStats(result.stats || null)
      setLastUpdate(new Date())
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'active_power_total': return Zap
      case 'voltage': 
      case 'voltage_rms': return Gauge
      case 'current':
      case 'current_rms': return Activity
      case 'frequency': return Activity
      default: return Database
    }
  }

  const getSensorUnit = (sensorType: string) => {
    switch (sensorType) {
      case 'active_power_total': return 'W'
      case 'voltage': 
      case 'voltage_rms': return 'V'
      case 'current':
      case 'current_rms': return 'A'
      case 'frequency': return 'Hz'
      default: return ''
    }
  }

  const formatSensorName = (sensorType: string) => {
    const names: { [key: string]: string } = {
      'active_power_total': 'Potenza Attiva',
      'voltage': 'Tensione',
      'voltage_rms': 'Tensione RMS',
      'current': 'Corrente',
      'current_rms': 'Corrente RMS',
      'frequency': 'Frequenza'
    }
    return names[sensorType] || sensorType.replace('_', ' ').toUpperCase()
  }

  const getSensorColor = (sensorType: string, value: number) => {
    switch (sensorType) {
      case 'voltage_rms':
        return value > 10 ? 'border-green-500/20 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'
      case 'current_rms':
        return value > 0.1 ? 'border-blue-500/20 bg-blue-500/5' : 'border-gray-500/20 bg-gray-500/5'
      default:
        return value > 0.01 ? 'border-green-500/20 bg-green-500/5' : ''
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-500">Errore connessione InfluxDB</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dati InfluxDB</h1>
            <p className="text-muted-foreground">
              Dati reali dal dispositivo finder_6m
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
              </div>
            )}
            <Button onClick={fetchData} disabled={isLoading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">✓</div>
                <p className="text-sm font-medium">Connessione InfluxDB</p>
                <p className="text-xs text-muted-foreground">Attiva e funzionante</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.keys(groupedData).length}</div>
                <p className="text-sm font-medium">Sensori Attivi</p>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(groupedData).join(', ').replace(/_/g, ' ')}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.length}</div>
                <p className="text-sm font-medium">Punti Dati</p>
                <p className="text-xs text-muted-foreground">Ultime 24 ore</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedData).map(([sensorType, sensorData]) => {
              const Icon = getSensorIcon(sensorType)
              const unit = getSensorUnit(sensorType)
              const name = formatSensorName(sensorType)
              
              // Determina se il valore è significativo
              const isActive = sensorType === 'voltage_rms' ? sensorData.latest._value > 5 : sensorData.latest._value > 0.01
              const cardColor = getSensorColor(sensorType, sensorData.latest._value)
              
              return (
                <Card key={sensorType} className={`hover:shadow-lg transition-shadow ${cardColor}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{name}</CardTitle>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-3">
                      {sensorData.latest._value.toFixed(3)} 
                      <span className="text-lg font-normal text-muted-foreground ml-2">{unit}</span>
                    </div>
                    
                    {/* Progress bar per voltage */}
                    {sensorType === 'voltage_rms' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>0V</span>
                          <span>230V</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((sensorData.latest._value / 230) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Progress bar per current */}
                    {sensorType === 'current_rms' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>0A</span>
                          <span>10A</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((sensorData.latest._value / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Min</p>
                        <p className="font-mono">{sensorData.min.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg</p>
                        <p className="font-mono">{sensorData.avg.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max</p>
                        <p className="font-mono">{sensorData.max.toFixed(3)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">
                        {sensorData.count} campioni
                      </p>
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                        {new Date(sensorData.latest._time).toLocaleTimeString('it-IT')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Raw Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dati Raw (Ultimi 50)</CardTitle>
            <CardDescription>
              Stream in tempo reale da InfluxDB - Measurement: energy_data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun dato trovato nel range selezionato
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Timestamp</th>
                      <th className="text-left p-2">Sensore</th>
                      <th className="text-left p-2">Valore</th>
                      <th className="text-left p-2">Dispositivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 50).map((point, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">
                          {new Date(point._time).toLocaleString('it-IT')}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {formatSensorName(point.sensor_type)}
                          </Badge>
                        </td>
                        <td className="p-2 font-mono">
                          {point._value.toFixed(3)} {getSensorUnit(point.sensor_type)}
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {point.device}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
              {JSON.stringify({
                totalRecords: data.length,
                uniqueSensors: Object.keys(groupedData).length,
                devices: [...new Set(data.map(d => d.device))],
                sensorTypes: [...new Set(data.map(d => d.sensor_type))],
                csvHeaders: stats?.csvHeaders || 'Not available',
                firstRowExample: data[0] || 'No data',
                timeRange: stats?.timeRange || null
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}