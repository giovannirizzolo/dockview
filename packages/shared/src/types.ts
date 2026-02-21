export type ContainerStatus =
  | "running"
  | "exited"
  | "restarting"
  | "paused"
  | "created"
  | "removing"
  | "dead"
  | "unknown";

export type HealthStatus = "healthy" | "unhealthy" | "starting" | "none" | "unknown";

export interface PortMapping {
  container: number;
  host: number;
  protocol: "tcp" | "udp";
}

export interface ComposeService {
  name: string;
  image?: string;
  dependsOn: string[];
  ports: string[];
  volumes: string[];
  environment: Record<string, string>;
  healthcheck?: {
    test?: string[] | string;
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
    disable?: boolean;
  };
}

export interface DockviewContainer {
  id: string;
  name: string;
  service?: string; // from compose label if available
  image: string;
  status: ContainerStatus;
  health: HealthStatus;
  ports: PortMapping[];
  startedAt?: string;
  uptimeSec?: number;
  restarts?: number;
  networks: string[];
  labels: Record<string, string>;
}

