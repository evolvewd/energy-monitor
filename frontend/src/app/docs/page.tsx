// src/app/docs/page.tsx
"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDashboard } from "@/hooks/useDashboard";
import {
  Server,
  Database,
  Zap,
  Code,
  Wifi,
  FileText,
  Users,
  Mail,
  ExternalLink,
  Github,
  Globe,
  Cpu,
  Network,
  BarChart3,
} from "lucide-react";

interface StackItem {
  name: string;
  version?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  docs?: string;
}

interface TeamMember {
  name: string;
  role: string;
  expertise: string[];
  email?: string;
  avatar?: string;
}

const techStack: StackItem[] = [
  {
    name: "Next.js",
    version: "15.3.5",
    description: "Framework React per il frontend",
    icon: Code,
    category: "Frontend",
    docs: "https://nextjs.org/docs",
  },
  {
    name: "React",
    version: "19.0.0",
    description: "Libreria per interfacce utente",
    icon: Code,
    category: "Frontend",
  },
  {
    name: "TypeScript",
    version: "5.x",
    description: "Linguaggio tipizzato per JavaScript",
    icon: Code,
    category: "Frontend",
  },
  {
    name: "Tailwind CSS",
    version: "4.x",
    description: "Framework CSS utility-first",
    icon: Code,
    category: "Frontend",
  },
  {
    name: "shadcn/ui",
    description: "Componenti UI accessibili e customizzabili",
    icon: Code,
    category: "Frontend",
  },
  {
    name: "Node-RED",
    description: "Tool di programmazione visuale per IoT",
    icon: Network,
    category: "Backend",
    docs: "https://nodered.org/docs/",
  },
  {
    name: "InfluxDB",
    description: "Database time-series per metriche",
    icon: Database,
    category: "Database",
    docs: "https://docs.influxdata.com/",
  },
  {
    name: "Grafana",
    description: "Piattaforma di monitoraggio e visualizzazione",
    icon: BarChart3,
    category: "Monitoring",
    docs: "https://grafana.com/docs/",
  },
  {
    name: "MQTT Broker",
    description: "Protocollo messaging per IoT",
    icon: Wifi,
    category: "Communication",
  },
  {
    name: "Nginx",
    description: "Reverse proxy e web server",
    icon: Server,
    category: "Infrastructure",
    docs: "https://nginx.org/en/docs/",
  },
  {
    name: "Docker",
    description: "Containerizzazione e orchestrazione",
    icon: Server,
    category: "Infrastructure",
    docs: "https://docs.docker.com/",
  },
  {
    name: "Arduino Opta",
    description: "PLC industriale per automazione",
    icon: Cpu,
    category: "Hardware",
    docs: "https://docs.arduino.cc/hardware/opta",
  },
  {
    name: "Modbus RS485",
    description: "Protocollo di comunicazione industriale",
    icon: Network,
    category: "Communication",
  },
];

const teamMembers: TeamMember[] = [
  {
    name: "Vincenzo Bevivino",
    role: "Full Stack Developer",
    expertise: ["Frontend", "Node-RED", "Nginx", "Docker", "InfluxDB"],
    email: "v.bevivino@assistectorino.it",
  },
  {
    name: "Luca Canelli",
    role: "Hardware & Communication Specialist",
    expertise: ["Arduino Opta", "Modbus RS485", "MQTT", "IoT Integration"],
    email: "l.canelli@assistectorino.it",
  },
];

const categories = [
  "Frontend",
  "Backend",
  "Database",
  "Infrastructure",
  "Hardware",
  "Communication",
  "Monitoring",
];

export default function DocsPage() {
  const {
    currentTime,
    healthPercentage,
    connectionStatus, // ← AGGIUNGI
    isTestingConnections, // ← AGGIUNGI
    testConnections, // ← AGGIUNGI
  } = useDashboard();

  return (
    <DashboardLayout
      pageTitle="Documentazione"
      pageSubtitle="Stack tecnologico e informazioni di sviluppo"
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus} // ← AGGIUNGI
      isTestingConnections={isTestingConnections} // ← AGGIUNGI
      onTestConnections={testConnections}
    >
      <div className="space-y-8">
        {/* Panoramica del Progetto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Energy Monitor System</span>
            </CardTitle>
            <CardDescription>
              Sistema di monitoraggio energetico industriale per la raccolta,
              elaborazione e visualizzazione di dati energetici in tempo reale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Database className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Real-time Data</h3>
                <p className="text-sm text-muted-foreground">
                  Acquisizione continua dati energetici
                </p>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <BarChart3 className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Analisi e reportistica avanzata
                </p>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Network className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Industrial IoT</h3>
                <p className="text-sm text-muted-foreground">
                  Integrazione con sistemi industriali
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stack Tecnologico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-primary" />
              <span>Stack Tecnologico</span>
            </CardTitle>
            <CardDescription>
              Tecnologie e framework utilizzati nello sviluppo del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.map((category) => {
              const categoryItems = techStack.filter(
                (item) => item.category === category
              );
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-primary">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map((item) => (
                      <div
                        key={item.name}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <item.icon className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">{item.name}</h4>
                          </div>
                          {item.version && (
                            <Badge variant="secondary" className="text-xs">
                              v{item.version}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        {item.docs && (
                          <a
                            href={item.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Documentazione
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {category !== categories[categories.length - 1] && (
                    <Separator className="mt-6" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Team di Sviluppo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Team di Sviluppo</span>
            </CardTitle>
            <CardDescription>
              I professionisti che hanno realizzato il sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamMembers.map((member) => (
                <div key={member.name} className="border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{member.name}</h3>
                      <p className="text-primary font-medium mb-2">
                        {member.role}
                      </p>
                      {member.email && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                          <Mail className="h-4 w-4" />
                          <a
                            href={`mailto:${member.email}`}
                            className="hover:text-primary"
                          >
                            {member.email}
                          </a>
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Competenze:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {member.expertise.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informazioni Aziendali */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary" />
              <span>Assistec S.r.l.</span>
            </CardTitle>
            <CardDescription>
              Automazione industriale e sistemi di controllo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Contatti</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href="https://www.assistectorino.it"
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      www.assistec.it
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>info@assistectorino.it</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Settori di Competenza</h3>
                <div className="space-y-1 text-sm">
                  <div>• Automazione industriale</div>
                  <div>• Sistemi di controllo</div>
                  <div>• Monitoraggio energetico</div>
                  <div>• Internet of Things (IoT)</div>
                  <div>• Integrazione sistemi</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>
            Energy Monitor System v2.0 - Sviluppato da Assistectorino Tecnologie
            Elettriche ed Elettroniche
          </p>
          <p className="mt-1">
            © 2025 Assistectorino - Tutti i diritti riservati
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
