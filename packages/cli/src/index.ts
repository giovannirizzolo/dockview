import { Command } from "commander";
import { parseComposeFile } from "./docker/compose-parser";
import { createDockerClient, listDockviewContainers } from "./docker/client";

const program = new Command();

program
  .name("dockview")
  .description("Real-time Docker Compose dev environment monitor")
  .option("-f, --file <path>", "Path to docker-compose.yml", "docker-compose.yml");

program.parse(process.argv);

async function main() {
  const opts = program.opts<{ file: string }>();

  const services = parseComposeFile(opts.file);
  const docker = createDockerClient();
  const containers = await listDockviewContainers(docker);

  const byService = new Map(containers.filter(c => c.service).map(c => [c.service!, c]));

  console.log(`🐳 Dockview (Weekend 1)`);
  console.log(`Compose: ${opts.file} — ${services.length} services\n`);

  console.table(
    services.map((s) => {
      const c = byService.get(s.name);
      return {
        service: s.name,
        image: s.image ?? "",
        dependsOn: s.dependsOn.join(", "),
        container: c?.name ?? "(not created)",
        status: c?.status ?? "unknown",
        ports: (c?.ports ?? []).map(p => `${p.host}->${p.container}/${p.protocol}`).join(", ")
      };
    })
  );
}

main().catch((err) => {
  console.error("❌ dockview error:", err?.message ?? err);
  process.exit(1);
});

