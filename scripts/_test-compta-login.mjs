import { chromium } from "playwright";

const base = "https://uat.upjunoo.com/pro";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("response", async (res) => {
  if (res.url().includes("/auth/login")) {
    console.log("LOGIN RESP", res.status(), await res.text().catch(() => ""));
  }
});

page.on("console", (msg) => console.log("CONSOLE", msg.type(), msg.text()));

await page.goto(`${base}/compta/login`, { waitUntil: "networkidle", timeout: 60_000 });
await page.fill('input[type="email"]', "comptable@upjunoo-dev.tech");
await page.locator('input[type="password"]').first().fill("123456789");
await page.click('button[type="submit"]');

for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  console.log(`t+${i + 1}s URL:`, page.url());
}

await browser.close();
