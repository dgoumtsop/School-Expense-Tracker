// the session is a cookie holding "expiry.signature", the signature is an HMAC of the expiry
// uses Web Crypto so the same code runs in the proxy and in server actions

export const SESSION_COOKIE = "session";
export const SESSION_SECONDS = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

// compares every character so the time taken doesn't leak how much matched
function sameString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createToken() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const expires = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expires}.${await sign(expires, secret)}`;
}

export async function verifyToken(token: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  // no secret means nobody can be logged in
  if (!secret || !token) return false;

  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!(Number(expires) > Date.now())) return false;

  return sameString(signature, await sign(expires, secret));
}