// frontend/src/contexts/TvccContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CameraConfig {
  id: string;
  name: string;
  ipAddress: string;
  username: string;
  password: string;
  status: "connected" | "disconnected" | "testing";
  enabled: boolean;
}

interface TvccSettings {
  tvccEnabled: boolean;
  refreshInterval: string;
  cameras: CameraConfig[];
}

interface TvccContextType {
  settings: TvccSettings;
  updateSettings: (newSettings: Partial<TvccSettings>) => void;
  updateCamera: (id: string, updates: Partial<CameraConfig>) => void;
  addCamera: () => void;
  removeCamera: (id: string) => void;
  testCameraConnection: (id: string) => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

const defaultSettings: TvccSettings = {
  tvccEnabled: false,
  refreshInterval: "5000",
  cameras: [
    {
      id: "1",
      name: "Retro",
      ipAddress: "192.168.2.234",
      username: "admin",
      password: "Assistec",
      status: "connected",
      enabled: true,
    },
  ],
};

const TvccContext = createContext<TvccContextType | undefined>(undefined);

export const useTvccSettings = () => {
  const context = useContext(TvccContext);
  if (context === undefined) {
    throw new Error("useTvccSettings must be used within a TvccProvider");
  }
  return context;
};

interface TvccProviderProps {
  children: ReactNode;
}

export const TvccProvider: React.FC<TvccProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<TvccSettings>(defaultSettings);

  // Carica le impostazioni dal localStorage al mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("tvcc-settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error("Errore nel caricamento delle impostazioni TVCC:", error);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("tvcc-settings", JSON.stringify(settings));
      console.log("Impostazioni TVCC salvate:", settings);
    } catch (error) {
      console.error("Errore nel salvataggio delle impostazioni TVCC:", error);
    }
  };

  const updateSettings = (newSettings: Partial<TvccSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateCamera = (id: string, updates: Partial<CameraConfig>) => {
    setSettings((prev) => ({
      ...prev,
      cameras: prev.cameras.map((camera) =>
        camera.id === id ? { ...camera, ...updates } : camera
      ),
    }));
  };

  const addCamera = () => {
    const newCamera: CameraConfig = {
      id: Date.now().toString(),
      name: `Camera ${settings.cameras.length + 1}`,
      ipAddress: "",
      username: "admin",
      password: "",
      status: "disconnected",
      enabled: true,
    };
    setSettings((prev) => ({
      ...prev,
      cameras: [...prev.cameras, newCamera],
    }));
  };

  const removeCamera = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      cameras: prev.cameras.filter((camera) => camera.id !== id),
    }));
  };

  const testCameraConnection = (id: string) => {
    updateCamera(id, { status: "testing" });

    // Simula test di connessione
    setTimeout(() => {
      const isConnected = Math.random() > 0.3;
      updateCamera(id, {
        status: isConnected ? "connected" : "disconnected",
      });
    }, 2000);
  };

  const contextValue: TvccContextType = {
    settings,
    updateSettings,
    updateCamera,
    addCamera,
    removeCamera,
    testCameraConnection,
    saveSettings,
    loadSettings,
  };

  return (
    <TvccContext.Provider value={contextValue}>{children}</TvccContext.Provider>
  );
};
