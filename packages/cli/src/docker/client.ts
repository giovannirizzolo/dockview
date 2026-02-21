import Docker from "dockerode";
import type { DockviewContainer, ContainerStatus, HealthStatus, PortMapping } from "@dockview/shared";

export function createDockerClient() {
  // default socket path works on Linux/macOS with Docker Desktop too
  return new Docker({ socketPath: "/var/run/docker.sock" });
}

function mapStateToStatus(state?: string): ContainerStatus {
  if (!state) return "unknown";
  const s = state.toLowerCase();
  if (["running", "exited", "restarting", "paused", "created", "removing", "dead"].includes(s)) {
    return s as ContainerStatus;
  }
  return "unknown";
}

function mapHealth(health?: string): HealthStatus {
  if (!health) return "none";
  const h = health.toLowerCase();
  if (h === "healthy") return "healthy";
  if (h === "unhealthy") return "unhealthy";
  if (h === "starting") return "starting";
  return "unknown";
}

function mapPorts(ports: any[] | undefined): PortMapping[] {
  if (!ports) return [];
  const out: PortMapping[] = [];
  for (const p of ports) {
    // dockerode Port structure: { IP, PrivatePort, PublicPort, Type }
    if (!p?.PrivatePort || !p?.PublicPort || !p?.Type) continue;
    out.push({
      container: Number(p.PrivatePort),
      host: Number(p.PublicPort),
      protocol: p.Type === "udp" ? "udp" : "tcp"
    });
  }
  return out;
}

export async function listDockviewContainers(docker: Docker): Promise<DockviewContainer[]> {
  const containers = await docker.listContainers({ all: true });

  return containers.map((c) => {
    const labels = c.Labels ?? {};
    const service = labels["com.docker.compose.service"];

    return {
      id: c.Id,
      name: (c.Names?.[0] ?? "").replace(/^\//, ""),
      service,
      image: c.Image ?? "",
      status: mapStateToStatus(c.State),
      health: mapHealth(labels["com.docker.compose.container.health"]), // sometimes absent
      ports: mapPorts(c.Ports),
      restarts: undefined,
      networks: Object.keys(c.NetworkSettings?.Networks ?? {}),
      labels
    };
  });
}
