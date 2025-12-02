"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2, Save, AlertCircle, Home, Zap, Trash2 } from "lucide-react";
import type { SystemSettings, AlloggioConfig, LettoreModbusConfig } from "@/types/settings";

export default function SetupPage() {
  const router = useRouter();
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    produzione_fv: false,
    accumulo_enabled: false,
    num_alloggi: 0,
    alloggi: [],
    lettori: [],
    location: {
      city: "",
      address: "",
    },
  });

  // Carica dati esistenti al mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (data.success && data.data) {
          const existingSettings = data.data.settings;
          const existingAlloggi = data.data.alloggi || [];
          const existingLettori = data.data.lettori || [];

          // Prepara alloggi
          const numAlloggi = parseInt(existingSettings.num_alloggi || "0");
          const alloggi: AlloggioConfig[] = [];
          for (let i = 1; i <= numAlloggi; i++) {
            const existing = existingAlloggi.find((a: any) => a.alloggio_id === i.toString());
            const alloggioId = `alloggio_${i}`;
            const lettoreAlloggio = existingLettori.find((l: any) => l.reader_id === alloggioId);
            alloggi.push({
              alloggio_id: i.toString(),
              name: existing?.name || `Alloggio ${i}`,
              topic_prefix: existing?.topic_prefix || `alloggio_${i}`,
              modbus_address: lettoreAlloggio?.modbus_address || 0,
            });
          }

          // Prepara lettori
          const lettori: LettoreModbusConfig[] = [];
          
          // Parti comuni (sempre presente)
          const partiComuni = existingLettori.find((l: any) => l.reader_id === "parti_comuni");
          lettori.push({
            reader_id: "parti_comuni",
            type: "parti_comuni",
            name: partiComuni?.name || "Parti Comuni",
            modbus_address: partiComuni?.modbus_address || 0,
            model: partiComuni?.model || "6m",
          });

          // Produzione (se abilitata)
          if (existingSettings.produzione_fv === "true") {
            const produzione = existingLettori.find((l: any) => l.reader_id === "produzione");
            lettori.push({
              reader_id: "produzione",
              type: "produzione",
              name: produzione?.name || "Produzione Fotovoltaica",
              modbus_address: produzione?.modbus_address || 0,
              model: produzione?.model || "6m",
            });
          }

          // Accumulo AC e DC (se abilitato)
          if (existingSettings.accumulo_enabled === "true") {
            const accumuloAC = existingLettori.find((l: any) => l.reader_id === "accumulo_ac");
            lettori.push({
              reader_id: "accumulo_ac",
              type: "accumulo_ac",
              name: accumuloAC?.name || "Accumulo AC",
              modbus_address: accumuloAC?.modbus_address || 0,
              model: accumuloAC?.model || "6m",
            });

            const accumuloDC = existingLettori.find((l: any) => l.reader_id === "accumulo_dc");
            lettori.push({
              reader_id: "accumulo_dc",
              type: "accumulo_dc",
              name: accumuloDC?.name || "Accumulo DC (Batteria)",
              modbus_address: accumuloDC?.modbus_address || 0,
              model: accumuloDC?.model || "6m",
            });
          }

          // Alloggi
          for (let i = 1; i <= numAlloggi; i++) {
            const alloggioId = `alloggio_${i}`;
            const existing = existingLettori.find((l: any) => l.reader_id === alloggioId);
            const alloggio = alloggi.find((a) => a.alloggio_id === i.toString());
            lettori.push({
              reader_id: alloggioId,
              type: "alloggio",
              name: existing?.name || alloggio?.name || `Alloggio ${i}`,
              modbus_address: existing?.modbus_address || 0,
              model: existing?.model || "6m",
              alloggio_id: i.toString(),
            });
          }

          // Carica location se presente
          const locationCity = existingSettings.location_city || "";
          const locationAddress = existingSettings.location_address || "";

          // Carica settings principali
          const newSettings: SystemSettings = {
            produzione_fv: existingSettings.produzione_fv === "true",
            accumulo_enabled: existingSettings.accumulo_enabled === "true",
            num_alloggi: numAlloggi,
            alloggi,
            lettori,
            location: {
              city: locationCity,
              address: locationAddress,
            },
          };

          setSettings(newSettings);
        }
      } catch (err) {
        console.error("Error loading existing settings:", err);
        // Se non ci sono dati, continua con i valori di default
      } finally {
        setIsLoadingData(false);
        setDataLoaded(true);
      }
    };

    loadExistingData();
  }, []);

  // Aggiorna alloggi quando cambia num_alloggi (solo dopo il caricamento iniziale)
  useEffect(() => {
    if (!dataLoaded) return;

    const newAlloggi: AlloggioConfig[] = [];
    for (let i = 1; i <= settings.num_alloggi; i++) {
      const existing = settings.alloggi.find((a) => a.alloggio_id === i.toString());
      newAlloggi.push({
        alloggio_id: i.toString(),
        name: existing?.name || `Alloggio ${i}`,
        topic_prefix: existing?.topic_prefix || `alloggio_${i}`,
        modbus_address: existing?.modbus_address || 0,
      });
    }
    setSettings((prev) => ({ ...prev, alloggi: newAlloggi }));
  }, [settings.num_alloggi, dataLoaded]);

  // Aggiorna lettori Modbus in base alle opzioni (solo dopo il caricamento iniziale)
  useEffect(() => {
    if (!dataLoaded) return;

    const currentLettori = settings.lettori;
    const newLettori: LettoreModbusConfig[] = [];

    // Parti comuni (sempre presente)
    const partiComuni = currentLettori.find((l) => l.reader_id === "parti_comuni");
    newLettori.push({
      reader_id: "parti_comuni",
      type: "parti_comuni",
      name: partiComuni?.name || "Parti Comuni",
      modbus_address: partiComuni?.modbus_address || 0,
      model: partiComuni?.model || "6m",
    });

    // Produzione (se abilitata)
    if (settings.produzione_fv) {
      const produzione = currentLettori.find((l) => l.reader_id === "produzione");
      newLettori.push({
        reader_id: "produzione",
        type: "produzione",
        name: produzione?.name || "Produzione Fotovoltaica",
        modbus_address: produzione?.modbus_address || 0,
        model: produzione?.model || "6m",
      });
    }

    // Accumulo AC (se abilitato)
    if (settings.accumulo_enabled) {
      const accumuloAC = currentLettori.find((l) => l.reader_id === "accumulo_ac");
      newLettori.push({
        reader_id: "accumulo_ac",
        type: "accumulo_ac",
        name: accumuloAC?.name || "Accumulo AC",
        modbus_address: accumuloAC?.modbus_address || 0,
        model: accumuloAC?.model || "6m",
      });

      // Accumulo DC (se abilitato)
      const accumuloDC = currentLettori.find((l) => l.reader_id === "accumulo_dc");
      newLettori.push({
        reader_id: "accumulo_dc",
        type: "accumulo_dc",
        name: accumuloDC?.name || "Accumulo DC (Batteria)",
        modbus_address: accumuloDC?.modbus_address || 0,
        model: accumuloDC?.model || "6m",
      });
    }

    // Alloggi
    for (let i = 1; i <= settings.num_alloggi; i++) {
      const alloggioId = `alloggio_${i}`;
      const existing = currentLettori.find((l) => l.reader_id === alloggioId);
      const alloggio = settings.alloggi.find((a) => a.alloggio_id === i.toString());
      // Prendi l'indirizzo modbus dall'alloggio se presente, altrimenti dal lettore esistente
      // Priorità: alloggio.modbus_address > existing.modbus_address > 0
      const modbusAddress = alloggio?.modbus_address || existing?.modbus_address || 0;
      newLettori.push({
        reader_id: alloggioId,
        type: "alloggio",
        name: existing?.name || alloggio?.name || `Alloggio ${i}`,
        modbus_address: modbusAddress,
        model: existing?.model || "6m",
        alloggio_id: i.toString(),
      });
    }

    // Aggiorna solo se la struttura è cambiata (non se sono solo i valori)
    const lettoriChanged = 
      newLettori.length !== currentLettori.length ||
      newLettori.some((l, idx) => {
        const existing = currentLettori[idx];
        return !existing || existing.reader_id !== l.reader_id || existing.type !== l.type;
      });

    if (lettoriChanged) {
      setSettings((prev) => ({ ...prev, lettori: newLettori }));
    }
  }, [settings.produzione_fv, settings.accumulo_enabled, settings.num_alloggi, dataLoaded]);

  // L'indirizzo modbus degli alloggi viene gestito solo nella sezione lettori Modbus
  // Non serve sincronizzazione perché l'utente modifica direttamente il lettore

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validazione
      if (settings.num_alloggi < 0) {
        throw new Error("Il numero di alloggi deve essere >= 0");
      }

      if (settings.num_alloggi > 0) {
        for (const alloggio of settings.alloggi) {
          if (!alloggio.name.trim()) {
            throw new Error(`Il nome dell'alloggio ${alloggio.alloggio_id} è obbligatorio`);
          }
        }
      }

      // L'indirizzo modbus degli alloggi viene gestito solo nella sezione lettori Modbus
      // Non serve sincronizzazione perché l'utente modifica direttamente il lettore
      const settingsToSave = { ...settings };

      // Validazione lettori Modbus
      for (const lettore of settingsToSave.lettori) {
        if (!lettore.name.trim()) {
          throw new Error(`Il nome del lettore ${lettore.reader_id} è obbligatorio`);
        }
        if (!lettore.modbus_address || lettore.modbus_address < 1 || lettore.modbus_address > 247) {
          throw new Error(`Indirizzo Modbus per ${lettore.name} deve essere tra 1 e 247`);
        }
      }

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Errore nel salvataggio delle impostazioni");
      }

      // Reindirizza alla homepage
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare completamente la configurazione dell'impianto? Questa azione non può essere annullata.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Errore nell'eliminazione della configurazione");
      }

      // Reset dello stato locale
      setSettings({
        produzione_fv: false,
        accumulo_enabled: false,
        num_alloggi: 0,
        alloggi: [],
        lettori: [],
      });

      // Reindirizza alla homepage
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  const handleAlloggioChange = (alloggio_id: string, field: keyof AlloggioConfig, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      alloggi: prev.alloggi.map((a) =>
        a.alloggio_id === alloggio_id ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleLettoreChange = (reader_id: string, field: "name" | "modbus_address" | "model", value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      lettori: prev.lettori.map((l) =>
        l.reader_id === reader_id ? { ...l, [field]: value } : l
      ),
    }));
  };

  // Mostra loading durante il caricamento dei dati
  if (isLoadingData) {
    return (
      <DashboardLayout
        pageTitle="Configurazione Impianto"
        pageSubtitle="Caricamento configurazione..."
        notifications={0}
        healthPercentage={healthPercentage}
        currentTime={currentTime}
        systemStatus="online"
        connectionStatus={connectionStatus}
        isTestingConnections={isTestingConnections}
        onTestConnections={testConnections}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Caricamento configurazione...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Configurazione Impianto"
      pageSubtitle="Configura o modifica il sistema di monitoraggio energetico"
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      <div className="max-w-4xl mx-auto">
        {/* Alert errore */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Card Unica di Configurazione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Configurazione Impianto
            </CardTitle>
            <CardDescription>
              Configura il sistema di monitoraggio energetico e gli indirizzi Modbus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sezione Opzioni Sistema */}
            <div className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold">Opzioni Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="produzione_fv">Produzione Fotovoltaica</Label>
                    <p className="text-xs text-muted-foreground">
                      Sistema di produzione presente
                    </p>
                  </div>
                  <Switch
                    id="produzione_fv"
                    checked={settings.produzione_fv}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, produzione_fv: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="accumulo_enabled">Sistema Accumulo</Label>
                    <p className="text-xs text-muted-foreground">
                      Batterie di accumulo presenti
                    </p>
                  </div>
                  <Switch
                    id="accumulo_enabled"
                    checked={settings.accumulo_enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, accumulo_enabled: checked }))
                    }
                  />
                </div>
              </div>
              
              {/* Sezione Location */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-semibold">Localizzazione Impianto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_city">Città</Label>
                    <Input
                      id="location_city"
                      type="text"
                      placeholder="Es: Milano"
                      value={settings.location?.city || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            city: e.target.value,
                          },
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Città dell'impianto per il meteo
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_address">Indirizzo (opzionale)</Label>
                    <Input
                      id="location_address"
                      type="text"
                      placeholder="Es: Via Roma 1"
                      value={settings.location?.address || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            address: e.target.value,
                          },
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Indirizzo completo per geocoding
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="num_alloggi">Numero di Alloggi</Label>
                <Input
                  id="num_alloggi"
                  type="number"
                  min="0"
                  max="50"
                  value={settings.num_alloggi}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      num_alloggi: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="max-w-xs"
                />
              </div>
            </div>

            {/* Sezione Lettori Modbus */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Lettori Modbus</h3>
              <div className="space-y-3">
                {settings.lettori.map((lettore) => (
                  <div
                    key={lettore.reader_id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`name_${lettore.reader_id}`} className="text-xs">
                        Nome
                      </Label>
                      <Input
                        id={`name_${lettore.reader_id}`}
                        value={lettore.name}
                        onChange={(e) =>
                          handleLettoreChange(lettore.reader_id, "name", e.target.value)
                        }
                        placeholder="Nome lettore"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`modbus_${lettore.reader_id}`} className="text-xs">
                        Indirizzo Modbus
                      </Label>
                      <Input
                        id={`modbus_${lettore.reader_id}`}
                        type="number"
                        min="1"
                        max="247"
                        value={lettore.modbus_address || ""}
                        onChange={(e) =>
                          handleLettoreChange(
                            lettore.reader_id,
                            "modbus_address",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="1-247"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`model_${lettore.reader_id}`} className="text-xs">
                        Modello Sensore
                      </Label>
                      <Select
                        value={lettore.model || "6m"}
                        onValueChange={(value) =>
                          handleLettoreChange(lettore.reader_id, "model", value as "6m" | "7m")
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleziona modello" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6m">6m</SelectItem>
                          <SelectItem value="7m">7m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo</Label>
                      <div className="h-9 flex items-center text-sm text-muted-foreground capitalize">
                        {lettore.type.replace("_", " ")}
                        {lettore.alloggio_id && ` - ${lettore.alloggio_id}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sezione Alloggi (solo se presenti) */}
            {settings.alloggi.length > 0 && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold">Dettagli Alloggi</h3>
                <div className="space-y-3">
                  {settings.alloggi.map((alloggio) => (
                    <div
                      key={alloggio.alloggio_id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`name_${alloggio.alloggio_id}`} className="text-xs">
                          Nome Alloggio {alloggio.alloggio_id}
                        </Label>
                        <Input
                          id={`name_${alloggio.alloggio_id}`}
                          value={alloggio.name}
                          onChange={(e) =>
                            handleAlloggioChange(alloggio.alloggio_id, "name", e.target.value)
                          }
                          placeholder={`Alloggio ${alloggio.alloggio_id}`}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`topic_${alloggio.alloggio_id}`} className="text-xs">
                          Topic Prefix (opzionale)
                        </Label>
                        <Input
                          id={`topic_${alloggio.alloggio_id}`}
                          value={alloggio.topic_prefix || ""}
                          onChange={(e) =>
                            handleAlloggioChange(
                              alloggio.alloggio_id,
                              "topic_prefix",
                              e.target.value
                            )
                          }
                          placeholder={`alloggio_${alloggio.alloggio_id}`}
                          className="h-9"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottoni azione */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !settings.num_alloggi && !settings.produzione_fv && !settings.accumulo_enabled}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminazione...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina Impianto
              </>
            )}
          </Button>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              disabled={loading}
            >
              <Home className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Configurazione
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

