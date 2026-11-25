import { z } from "zod";

import { LOOPBACK_HOST, type Port } from "#dev/server/ports";
import {
  emptyResultSchema,
  openWebSocketRpc,
  type WebSocketUrl,
  webSocketUrlSchema
} from "#dev/tab-reload/websocket-rpc";
import { isYouTubeUrl } from "#dev/tab-reload/youtube-url";

const pageTargetsSchema = z.array(
  z.object({
    type: z.string(),
    url: z.string(),
    webSocketDebuggerUrl: webSocketUrlSchema.optional()
  })
);
const PAGE_TARGET_TYPE = "page";

/** Reloads every open YouTube tab over the Chrome DevTools Protocol, so each load runs the freshly built content script */
export async function reloadChromeYouTubeTabs(cdpPort: Port) {
  const response = await fetch(`http://${LOOPBACK_HOST}:${cdpPort}/json/list`);
  const targets = pageTargetsSchema.parse(await response.json());
  const reloads = [];
  for (const { type, url, webSocketDebuggerUrl } of targets) {
    const isYouTubeTab = type === PAGE_TARGET_TYPE && isYouTubeUrl(url) && webSocketDebuggerUrl !== undefined;
    if (isYouTubeTab) {
      reloads.push(reloadTarget(webSocketDebuggerUrl));
    }
  }
  await Promise.allSettled(reloads);
}

async function reloadTarget(webSocketDebuggerUrl: WebSocketUrl) {
  const webSocketRpc = await openWebSocketRpc<"Page.reload">(webSocketDebuggerUrl);
  await webSocketRpc.send({
    method: "Page.reload",
    params: {},
    resultSchema: emptyResultSchema
  });
  webSocketRpc.close();
}
