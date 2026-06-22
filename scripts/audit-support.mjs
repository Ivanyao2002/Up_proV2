const API_URL = "https://api.upjunoo-dev.tech";
const EMAIL = "dev.admin@upjunoo-dev.tech";
const PASSWORD = "Upjunoo@Dev2026!";
const PARTNER_ID = "71a1aad7-ad23-41ca-a6d0-b904d5953271";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  const login = await request("/v1/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
  const token = login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) { console.error("Login failed", login.status); process.exit(1); }

  // 1. Liste conversations
  const list = await request(`/v1/partners/${PARTNER_ID}/support/chat?page=1&per_page=5`, { token });
  console.log(`=== GET /support/chat ===`);
  console.log(`Status: ${list.status} ${list.ok ? "OK" : "ERROR"}`);
  console.log(`Response: ${JSON.stringify(list.json).slice(0, 500)}`);

  // Si on a des chats, tester le détail et l'envoi
  const chatId = list.json?.data?.[0]?.id ?? list.json?.items?.[0]?.id;
  if (chatId) {
    const detail = await request(`/v1/partners/${PARTNER_ID}/support/chat/${chatId}`, { token });
    console.log(`\n=== GET /support/chat/${chatId} ===`);
    console.log(`Status: ${detail.status} ${detail.ok ? "OK" : "ERROR"}`);
    console.log(`Response: ${JSON.stringify(detail.json).slice(0, 500)}`);

    const reply = await request(`/v1/partners/${PARTNER_ID}/support/chat/${chatId}/messages`, {
      method: "POST",
      token,
      body: { body: "Test message from audit script" },
    });
    console.log(`\n=== POST /support/chat/${chatId}/messages ===`);
    console.log(`Status: ${reply.status} ${reply.ok ? "OK" : "ERROR"}`);
    console.log(`Response: ${JSON.stringify(reply.json).slice(0, 300)}`);
  } else {
    console.log("\nAucune conversation trouvée pour tester le détail et l'envoi.");
  }
}

main().catch(console.error);
