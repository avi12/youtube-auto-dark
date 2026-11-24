import { z } from "zod";

import { LOOPBACK_HOST, type Port } from "#dev/server/ports";
import { openWebSocketRpc } from "#dev/tab-reload/websocket-rpc";
import { isYouTubeUrl } from "#dev/tab-reload/youtube-url";

const browsingContextTreeSchema = z.object({
  contexts: z.array(
    z.object({
      context: z.string(),
      url: z.string()
    })
  )
});

enum BidiMethod {
  SessionNew = "session.new",
  SessionEnd = "session.end",
  GetTree = "browsingContext.getTree",
  Reload = "browsingContext.reload"
}

/**
 * Reloads every open YouTube tab over WebDriver BiDi (Firefox's Remote Agent), so each load runs the freshly built
 * content script. One short-lived session per reload, since the Remote Agent allows a single BiDi session at a time
 */
export async function reloadFirefoxYouTubeTabs(remotePort: Port) {
  const webSocketRpc = await openWebSocketRpc<BidiMethod>(`ws://${LOOPBACK_HOST}:${remotePort}/session`);
  await webSocketRpc.send({
    method: BidiMethod.SessionNew,
    params: {
      capabilities: {}
    },
    resultSchema: z.unknown()
  });
  const { contexts } = await webSocketRpc.send({
    method: BidiMethod.GetTree,
    params: {
      maxDepth: 0
    },
    resultSchema: browsingContextTreeSchema
  });
  const reloads = [];
  for (const { context, url } of contexts) {
    if (isYouTubeUrl(url)) {
      reloads.push(
        webSocketRpc.send({
          method: BidiMethod.Reload,
          params: {
            context
          },
          resultSchema: z.unknown()
        })
      );
    }
  }
  await Promise.allSettled(reloads);
  await webSocketRpc.send({
    method: BidiMethod.SessionEnd,
    params: {},
    resultSchema: z.unknown()
  });
  webSocketRpc.close();
}
