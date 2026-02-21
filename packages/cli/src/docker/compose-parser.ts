import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ComposeService } from "@dockview/shared";

type RawCompose = {
  services?: Record<
    string,
    {
      image?: string;
      depends_on?: string[] | Record<string, unknown>;
      ports?: Array<string | number>;
      volumes?: string[];
      environment?: Record<string, string> | string[];
      healthcheck?: Record<string, unknown>;
    }
  >;
};

function normalizeEnvironment(env: unknown): Record<string, string> {
  if (!env) return {};
  if (Array.isArray(env)) {
    // ["A=1","B=2"]
    const out: Record<string, string> = {};
    for (const item of env) {
      if (typeof item !== "string") continue;
      const idx = item.indexOf("=");
      if (idx === -1) out[item] = "";
      else out[item.slice(0, idx)] = item.slice(idx + 1);
    }
    return out;
  }
  if (typeof env === "object") return env as Record<string, string>;
  return {};
}

function normalizeDependsOn(dep: unknown): string[] {
  if (!dep) return [];
  if (Array.isArray(dep)) return dep.filter((x): x is string => typeof x === "string");
  if (typeof dep === "object") return Object.keys(dep as Record<string, unknown>);
  return [];
}

export function parseComposeFile(composePath: string): ComposeService[] {
  const abs = path.resolve(composePath);
  const raw = fs.readFileSync(abs, "utf8");
  const doc = YAML.parse(raw) as RawCompose;

  const services = doc.services ?? {};
  return Object.entries(services).map(([name, s]) => ({
    name,
    image: s.image,
    dependsOn: normalizeDependsOn(s.depends_on),
    ports: (s.ports ?? []).map(String),
    volumes: s.volumes ?? [],
    environment: normalizeEnvironment(s.environment),
    healthcheck: s.healthcheck as ComposeService["healthcheck"]
  }));
}
