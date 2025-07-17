"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Settings,
  Wifi,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Save,
} from "lucide-react";

import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { useDashboard } from "@/hooks/useDashboard";

interface CameraConfig {
  id: string;
  name: string;
  ipAddress: string;
  username: string;
  password: string;
  status: "connected" | "disconnected" | "testing";
}

export default function SettingsPage() {
  const {
    currentTime,
    connectionStatus,
    isTestingConnections,
    systemHealth,
    totalServices,
    healthPercentage,
    testConnections,
  } = useDashboard();

  // Stati per la configurazione TVCC
  const [tvccEnabled, setTvccEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState("5000");
  const [cameras, setCameras] = useState<CameraConfig[]>([
    {
      id: "1",
      name: "Retro",
      ipAddress: "192.168.2.234",
      username: "admin",
      password: "Assistec",
      status: "connected",
    },
  ]);

  // Funzioni per gestire le telecamere
  const addCamera = () => {
    const newCamera: CameraConfig = {
      id: Date.now().toString(),
      name: `Camera ${cameras.length + 1}`,
      ipAddress: "",
      username: "admin",
      password: "",
      status: "disconnected",
    };
    setCameras([...cameras, newCamera]);
  };

  const removeCamera = (id: string) => {
    setCameras(cameras.filter((camera) => camera.id !== id));
  };

  const updateCamera = (
    id: string,
    field: keyof CameraConfig,
    value: string
  ) => {
    setCameras(
      cameras.map((camera) =>
        camera.id === id ? { ...camera, [field]: value } : camera
      )
    );
  };

  const testCameraConnection = (id: string) => {
    setCameras(
      cameras.map((camera) =>
        camera.id === id ? { ...camera, status: "testing" } : camera
      )
    );

    // Simula test di connessione
    setTimeout(() => {
      setCameras(
        cameras.map((camera) =>
          camera.id === id
            ? {
                ...camera,
                status: Math.random() > 0.3 ? "connected" : "disconnected",
              }
            : camera
        )
      );
    }, 2000);
  };

  const getStatusIcon = (status: CameraConfig["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = (status: CameraConfig["status"]) => {
    switch (status) {
      case "connected":
        return "Connessa";
      case "disconnected":
        return "Disconnessa";
      case "testing":
        return "Testing...";
    }
  };

  return (
    <DashboardLayout
      pageTitle="Impostazioni Sistema"
      pageSubtitle="Configurazione e parametri del sistema energetico"
      headerActions={
        <Button onClick={testConnections} disabled={isTestingConnections}>
          Test Connessioni
        </Button>
      }
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
    >
      <div className="space-y-6">
        {/* Sezione TVCC */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Sistema TVCC</CardTitle>
                  <CardDescription>
                    Configurazione del sistema di videosorveglianza
                  </CardDescription>
                </div>
              </div>
              <Badge variant={tvccEnabled ? "default" : "secondary"}>
                {tvccEnabled ? "Attivo" : "Disattivo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle principale TVCC */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Abilita Sistema TVCC
                </Label>
                <div className="text-sm text-muted-foreground">
                  Attiva la sezione telecamere nella dashboard principale
                </div>
              </div>
              <Switch checked={tvccEnabled} onCheckedChange={setTvccEnabled} />
            </div>

            {tvccEnabled && (
              <>
                <Separator />

                {/* Configurazione globale */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Configurazione Globale
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="refresh-interval">
                        Intervallo Aggiornamento
                      </Label>
                      <Select
                        value={refreshInterval}
                        onValueChange={setRefreshInterval}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona intervallo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2000">2 secondi</SelectItem>
                          <SelectItem value="5000">5 secondi</SelectItem>
                          <SelectItem value="10000">10 secondi</SelectItem>
                          <SelectItem value="30000">30 secondi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lista telecamere */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Telecamere Configurate
                    </h4>
                    <Button onClick={addCamera} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Camera
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {cameras.map((camera) => (
                      <Card key={camera.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Nome telecamera */}
                            <div className="space-y-2">
                              <Label>Nome</Label>
                              <Input
                                value={camera.name}
                                onChange={(e) =>
                                  updateCamera(
                                    camera.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Nome telecamera"
                              />
                            </div>

                            {/* Indirizzo IP */}
                            <div className="space-y-2">
                              <Label>Indirizzo IP</Label>
                              <Input
                                value={camera.ipAddress}
                                onChange={(e) =>
                                  updateCamera(
                                    camera.id,
                                    "ipAddress",
                                    e.target.value
                                  )
                                }
                                placeholder="192.168.1.100"
                              />
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                              <Label>Username</Label>
                              <Input
                                value={camera.username}
                                onChange={(e) =>
                                  updateCamera(
                                    camera.id,
                                    "username",
                                    e.target.value
                                  )
                                }
                                placeholder="admin"
                              />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                              <Label>Password</Label>
                              <Input
                                type="password"
                                value={camera.password}
                                onChange={(e) =>
                                  updateCamera(
                                    camera.id,
                                    "password",
                                    e.target.value
                                  )
                                }
                                placeholder="password"
                              />
                            </div>
                          </div>

                          {/* Status e azioni */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(camera.status)}
                              <span className="text-sm">
                                {getStatusText(camera.status)}
                              </span>
                              {camera.status === "connected" &&
                                camera.ipAddress && (
                                  <Badge variant="outline" className="text-xs">
                                    {camera.ipAddress}
                                  </Badge>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testCameraConnection(camera.id)}
                                disabled={
                                  camera.status === "testing" ||
                                  !camera.ipAddress
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Test
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeCamera(camera.id)}
                                disabled={cameras.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Azioni di salvataggio */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Annulla</Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Salva Configurazione
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
