// Relays the browser SDK's envelopes (`tunnel` option) so ad blockers that block
// *.ingest.sentry.io do not drop error reports. Only this project's DSN is relayed.
// Uses the Web handler signature to read the raw body: replay payloads are binary.
const SENTRY_HOST = "o4509397199486976.ingest.de.sentry.io";
const SENTRY_PROJECT_ID = "4510476688359504";
const MAX_ENVELOPE_BYTES = 4 * 1024 * 1024;

function readEnvelopeDsn(envelope: Uint8Array): URL | null {
  const headerEnd = envelope.indexOf(0x0a);
  const header = new TextDecoder().decode(
    headerEnd === -1 ? envelope : envelope.subarray(0, headerEnd),
  );
  try {
    const { dsn } = JSON.parse(header) as { dsn?: unknown };
    return typeof dsn === "string" ? new URL(dsn) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const envelope = new Uint8Array(await request.arrayBuffer());
  if (envelope.byteLength > MAX_ENVELOPE_BYTES) {
    return new Response("Payload too large", { status: 413 });
  }

  const dsn = readEnvelopeDsn(envelope);
  if (!dsn || dsn.hostname !== SENTRY_HOST || dsn.pathname !== `/${SENTRY_PROJECT_ID}`) {
    return new Response("Unknown DSN", { status: 400 });
  }

  const upstream = await fetch(`https://${SENTRY_HOST}/api/${SENTRY_PROJECT_ID}/envelope/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body: envelope,
  });
  return new Response(upstream.body, { status: upstream.status });
}
