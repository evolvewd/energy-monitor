// frontend/src/app/settings/page.tsx
"use client";

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
  Power,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTvccSettings, CameraConfig } from "@/contexts/TvccContext";
import { useState } from "react";

export default function SettingsPage() {
  const {
    currentTime,
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    testConnections,
  } = useDashboard();

  const {
    settings,
    updateSettings,
    updateCamera,
    addCamera,
    removeCamera,
    testCameraConnection,
    saveSettings,
  } = useTvccSettings();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleTvccEnabledChange = (enabled: boolean) => {
    updateSettings({ tvccEnabled: enabled });
    setHasUnsavedChanges(true);
  };

  const handleRefreshIntervalChange = (interval: string) => {
    updateSettings({ refreshInterval: interval });
    setHasUnsavedChanges(true);
  };

  const handleCameraUpdate = (
    id: string,
    field: keyof CameraConfig,
    value: string | boolean
  ) => {
    updateCamera(id, { [field]: value });
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    saveSettings();
    setHasUnsavedChanges(false);
  };

  const handleAddCamera = () => {
    addCamera();
    setHasUnsavedChanges(true);
  };

  const handleRemoveCamera = (id: string) => {
    removeCamera(id);
    setHasUnsavedChanges(true);
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
      pageSubtitle="Configurazione del sistema energetico e TVCC"
      headerActions={
        <div className="flex items-center space-x-2">
          <Button
            onClick={testConnections}
            disabled={isTestingConnections}
            variant="outline"
          >
            Test Connessioni
          </Button>
          {hasUnsavedChanges && (
            <Button onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Salva Modifiche
            </Button>
          )}
        </div>
      }
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      <div className="space-y-6">
        {/* Avviso modifiche non salvate */}
        {hasUnsavedChanges && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Hai modifiche non salvate. Clicca su "Salva Modifiche" per
              applicarle.
            </AlertDescription>
          </Alert>
        )}

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
              <Badge variant={settings.tvccEnabled ? "default" : "secondary"}>
                {settings.tvccEnabled ? "Attivo" : "Disattivo"}
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
              <Switch
                checked={settings.tvccEnabled}
                onCheckedChange={handleTvccEnabledChange}
              />
            </div>

            {settings.tvccEnabled && (
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
                        value={settings.refreshInterval}
                        onValueChange={handleRefreshIntervalChange}
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
                      Telecamere Configurate ({settings.cameras.length})
                    </h4>
                    <Button
                      onClick={handleAddCamera}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Camera
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {settings.cameras.map((camera) => (
                      <Card key={camera.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Header telecamera con stato */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {camera.name || `Camera ${camera.id}`}
                                </span>
                                {getStatusIcon(camera.status)}
                                <span className="text-sm text-muted-foreground">
                                  {getStatusText(camera.status)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={camera.enabled}
                                  onCheckedChange={(enabled) =>
                                    handleCameraUpdate(
                                      camera.id,
                                      "enabled",
                                      enabled
                                    )
                                  }
                                />
                                <Label className="text-sm">Attiva</Label>
                              </div>
                            </div>

                            {/* Configurazione telecamera */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Nome telecamera */}
                              <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                  value={camera.name}
                                  onChange={(e) =>
                                    handleCameraUpdate(
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
                                    handleCameraUpdate(
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
                                    handleCameraUpdate(
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
                                    handleCameraUpdate(
                                      camera.id,
                                      "password",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Password"
                                />
                              </div>
                            </div>

                            {/* Azioni telecamera */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                {camera.status === "connected" &&
                                  camera.ipAddress && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {camera.ipAddress}
                                    </Badge>
                                  )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    testCameraConnection(camera.id)
                                  }
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
                                  onClick={() => handleRemoveCamera(camera.id)}
                                  disabled={settings.cameras.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
