import { z } from "zod";

/** CDP and WebDriver BiDi frame commands alike: `{ id, method, params }` answered by `{ id, result }` or `{ id, error }` */
const replySchema = z.object({
  id: z.number(),
  result: z.unknown().optional(),
  error: z.unknown().optional()
});
type Reply = z.infer<typeof replySchema>;

/** A minimal command channel over one WebSocket; `close` ends it */
export async function openWebSocketRpc<TMethod extends string>(url: string) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pendingReplies = new Map<number, (reply: Reply) => void>();
  socket.addEventListener("message", event => {
    const parsed = replySchema.safeParse(JSON.parse(String(event.data)));
    if (!parsed.success) {
      return;
    }

    pendingReplies.get(parsed.data.id)?.(parsed.data);
    pendingReplies.delete(parsed.data.id);
  });

  /** Sends one command and parses its result with `resultSchema`, so callers get the result's precise type */
  async function send<TResult extends z.ZodType>({
    method,
    params,
    resultSchema
  }: {
    method: TMethod;
    params: Record<string, unknown>;
    resultSchema: TResult;
  }) {
    nextId++;
    const id = nextId;
    const reply = await new Promise<Reply>(resolve => {
      pendingReplies.set(id, resolve);
      socket.send(
        JSON.stringify({
          id,
          method,
          params
        })
      );
    });
    if (reply.error !== undefined) {
      throw new Error(`${method} failed: ${JSON.stringify(reply.error)}`);
    }

    return resultSchema.parse(reply.result);
  }

  return {
    send,
    close: () => socket.close()
  };
}
