export default function ApiHealth() {
  return Response.json({ ok: true, app: 'yapido-movilidad', ts: Date.now() });
}
