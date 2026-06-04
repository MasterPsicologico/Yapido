export function GET() {
  return Response.json({ ok: true, app: 'yapido-movilidad', ts: Date.now() });
}
