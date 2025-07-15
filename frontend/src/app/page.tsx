'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  RefreshCw,
  Gauge,
  Battery,
  DollarSign,
  Clock,
  ExternalLink,
  Power,
  Database,
  Wifi,
  Settings
} from 'lucide-react'
import { testAllConnections, type ServiceStatus, type ConnectionStatus } from '@/lib/connections'

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

// Enhanced MetricCard with shadcn styling
const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend,
  description,
  isLoading = false,
  variant = "default"
}: {
  title: string
  value: number | string
  unit: string
  icon: any
  trend?: number
  description?: string
  isLoading?: boolean
  variant?: "default" | "success" | "warning" | "destructive"
}) => {
  const variantStyles = {
    default: "border-border",
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5", 
    destructive: "border-red-500/20 bg-red-500/5"
  }

  if (isLoading) {
    return (
      <Card className={`${variantStyles[variant]} transition-colors`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${variantStyles[variant]} transition-all duration-200 hover:shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs mt-1 ${
            trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : null}
            {trend > 0 ? '+' : ''}{trend}% da ieri
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced StatusIndicator
const StatusIndicator = ({ 
  label, 
  status, 
  description 
}: { 
  label: string
  status: ConnectionStatus
  description?: string 
}) => {
  const statusConfig = {
    online: { 
      badge: 'bg-green-500/10 text-green-500 border-green-500/20',
      dot: 'bg-green-500',
      text: 'Online'
    },
    offline: { 
      badge: 'bg-red-500/10 text-red-500 border-red-500/20',
      dot: 'bg-red-500',
      text: 'Offline'
    },
    warning: { 
      badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      dot: 'bg-yellow-500',
      text: 'Warning'
    },
    testing: { 
      badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      dot: 'bg-blue-500 animate-pulse',
      text: 'Testing...'
    }
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Badge variant="secondary" className={config.badge}>
        {config.text}
      </Badge>
    </div>
  )
}

export default function EnergyDashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ServiceStatus>({
    influxdb: 'testing',
    mqtt: 'testing',
    grafana: 'testing',
    nodered: 'testing',
    nginx: 'testing'
  })
  const [isTestingConnections, setIsTestingConnections] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - sostituiremo con dati reali
  const [energyData, setEnergyData] = useState({
    currentPower: 2.35,
    voltage: 230.2,
    current: 10.2,
    totalConsumption: 156.7,
    costToday: 12.43,
    efficiency: 87.5
  })

  // Timer per aggiornare l'ora
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Test connessioni all'avvio
  useEffect(() => {
    testConnections()
    // Simula loading iniziale
    setTimeout(() => setIsLoading(false), 1500)
  }, [])

  // Funzione per testare tutte le connessioni
  const testConnections = async () => {
    setIsTestingConnections(true)
    
    try {
      const results = await testAllConnections()
      setConnectionStatus(results)
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus({
        influxdb: 'offline',
        mqtt: 'offline',
        grafana: 'offline',
        nodered: 'offline',
        nginx: 'offline'
      })
    } finally {
      setIsTestingConnections(false)
    }
  }

  // Calcola stato generale del sistema
  const systemHealth = Object.values(connectionStatus).filter(status => status === 'online').length
  const totalServices = Object.keys(connectionStatus).length
  const healthPercentage = (systemHealth / totalServices) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Energy Monitor</h1>
                  <p className="text-sm text-muted-foreground">
                    Sistema di monitoraggio energetico real-time
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {currentTime?.toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) || '--'}
                </p>
                <p className="text-lg font-mono font-semibold">
                  {currentTime?.toLocaleTimeString('it-IT') || '--:--:--'}
                </p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  healthPercentage === 100 ? 'bg-green-500' : 
                  healthPercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  Sistema {healthPercentage === 100 ? 'Operativo' : 'Parziale'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        
        {/* System Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Stato Sistema</span>
                </CardTitle>
                <CardDescription>
                  Monitoraggio connessioni e servizi ({systemHealth}/{totalServices} online)
                </CardDescription>
              </div>
              <Button
                onClick={testConnections}
                disabled={isTestingConnections}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isTestingConnections ? 'animate-spin' : ''}`} />
                {isTestingConnections ? 'Testing...' : 'Aggiorna'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={healthPercentage} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatusIndicator 
                label="InfluxDB" 
                status={connectionStatus.influxdb}
                description="Database time-series"
              />
              <StatusIndicator 
                label="MQTT Broker" 
                status={connectionStatus.mqtt}
                description="Messaggi IoT"
              />
              <StatusIndicator 
                label="Grafana" 
                status={connectionStatus.grafana}
                description="Dashboard avanzate"
              />
              <StatusIndicator 
                label="Node-RED" 
                status={connectionStatus.nodered}
                description="Flow automation"
              />
              <StatusIndicator 
                label="Nginx" 
                status={connectionStatus.nginx}
                description="Reverse proxy"
              />
            </div>
          </CardContent>
        </Card>

        {/* Energy Metrics */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Metriche Energetiche</h2>
              <p className="text-sm text-muted-foreground">Dati in tempo reale dal sistema</p>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
              <Clock className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Potenza Attuale"
              value={energyData.currentPower}
              unit="kW"
              icon={Zap}
              trend={5.2}
              description="Consumo istantaneo"
              isLoading={isLoading}
              variant="default"
            />
            <MetricCard
              title="Tensione"
              value={energyData.voltage}
              unit="V"
              icon={Gauge}
              description="Tensione di rete"
              isLoading={isLoading}
              variant="default"
            />
            <MetricCard
              title="Corrente"
              value={energyData.current}
              unit="A"
              icon={Activity}
              description="Corrente assorbita"
              isLoading={isLoading}
              variant="default"
            />
            <MetricCard
              title="Consumo Oggi"
              value={energyData.totalConsumption}
              unit="kWh"
              icon={Battery}
              trend={-2.1}
              description="Totale giornaliero"
              isLoading={isLoading}
              variant="default"
            />
            <MetricCard
              title="Costo Oggi"
              value={energyData.costToday}
              unit="€"
              icon={DollarSign}
              trend={-2.1}
              description="Spesa elettrica"
              isLoading={isLoading}
              variant="default"
            />
            <MetricCard
              title="Efficienza"
              value={energyData.efficiency}
              unit="%"
              icon={TrendingUp}
              trend={3.2}
              description="Performance sistema"
              isLoading={isLoading}
              variant="default"
            />
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consumo Energetico</CardTitle>
              <CardDescription>Ultime 24 ore</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Grafico in sviluppo</p>
                  <p className="text-xs text-muted-foreground mt-1">Dati real-time da InfluxDB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trend Settimanale</CardTitle>
              <CardDescription>Analisi dei consumi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Grafico in sviluppo</p>
                  <p className="text-xs text-muted-foreground mt-1">Analisi predittiva</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Azioni Rapide</span>
            </CardTitle>
            <CardDescription>
              Accesso diretto ai servizi di sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => window.open('http://localhost:3001', '_blank')}
                disabled={connectionStatus.grafana === 'offline'}
              >
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Grafana</p>
                  <p className="text-xs text-muted-foreground">Dashboard avanzate</p>
                </div>
                <ExternalLink className="w-3 h-3" />
              </Button>

              <Button 
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => window.open('http://localhost:1880', '_blank')}
                disabled={connectionStatus.nodered === 'offline'}
              >
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Node-RED</p>
                  <p className="text-xs text-muted-foreground">Flow editor</p>
                </div>
                <ExternalLink className="w-3 h-3" />
              </Button>

              <Button 
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => window.open('http://localhost:8086', '_blank')}
                disabled={connectionStatus.influxdb === 'offline'}
              >
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium">InfluxDB</p>
                  <p className="text-xs text-muted-foreground">Database</p>
                </div>
                <ExternalLink className="w-3 h-3" />
              </Button>

              <Button 
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={testConnections}
              >
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <RefreshCw className={`w-4 h-4 text-blue-500 ${isTestingConnections ? 'animate-spin' : ''}`} />
                </div>
                <div className="text-center">
                  <p className="font-medium">Test Sistema</p>
                  <p className="text-xs text-muted-foreground">Verifica connessioni</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Development Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dashboard in sviluppo:</strong> I dati mostrati sono simulati. 
            L'integrazione con i sensori reali e i grafici interattivi saranno implementati nelle prossime fasi.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}