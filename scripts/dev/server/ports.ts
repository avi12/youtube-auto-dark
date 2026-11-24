import { createServer } from "node:net";

import { z } from "zod";

import { logEvent } from "#dev/log";

const MAX_PORT_PROBES = 50;
export const LOOPBACK_HOST = "127.0.0.1";

export const portSchema = z.number().int().min(0).max(65_535).brand<"Port">();
export type Port = z.infer<typeof portSchema>;

function isPortFree(port: Port) {
  return new Promise<boolean>(resolve => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, LOOPBACK_HOST);
  });
}

/** The first free loopback port at or above `startPort`, so another browser's debugger never captures ours */
async function findFreeTcpPort(startPort: Port) {
  for (let candidate = startPort; candidate < startPort + MAX_PORT_PROBES; candidate++) {
    const port = portSchema.parse(candidate);
    if (await isPortFree(port)) {
      return port;
    }
  }

  return startPort;
}

/** Claims `preferredPort` or the next free one, logging when `label`'s preferred port was busy */
export async function claimFreePort({ preferredPort, label }: { preferredPort: Port; label: string }) {
  const port = await findFreeTcpPort(preferredPort);
  if (port !== preferredPort) {
    logEvent(`${label} port ${preferredPort} busy - using ${port}`);
  }

  return port;
}
