#!/usr/bin/env python3
"""
Rapport de corrections — Portail Franchise
Parcourt toutes les pages franchise, détecte les anomalies,
encadre en rouge les zones bugguées, prend des captures et génère un rapport .md

Prérequis :
    pip install playwright
    playwright install chromium

Usage :
    python scripts/rapport-corrections-franchise.py
"""

import os
import re
import sys
from datetime import date
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, Error as PlaywrightError

# ─── Config ──────────────────────────────────────────────────────────────────
BASE        = os.getenv("SCREENSHOT_BASE_URL", "http://localhost:3000")
EMAIL       = os.getenv("FRANCHISE_EMAIL",    "dev.franchise@upjunoo-dev.tech")
PASSWORD    = os.getenv("FRANCHISE_PASSWORD", "Upjunoo@Dev2026!")

ROOT         = Path(__file__).resolve().parent.parent
REPORT_DIR   = ROOT / "RAPPORT"
SCREENS_DIR  = REPORT_DIR / "screenshots"

REPORT_DIR.mkdir(exist_ok=True)
SCREENS_DIR.mkdir(exist_ok=True)

# ─── Pages statiques ─────────────────────────────────────────────────────────
STATIC_PAGES = [
    ("01-dashboard",                "/franchise/dashboard",                  "Dashboard"),
    ("02-carte-live",               "/franchise/map",                        "Carte live"),
    ("03-courses-liste",            "/franchise/trips",                      "Courses — liste"),
    ("04-drivers-liste",            "/franchise/drivers",                    "Chauffeurs — liste"),
    ("05-drivers-moderation",       "/franchise/drivers/moderation",         "Chauffeurs — modération"),
    ("06-fleet-vehicles",           "/franchise/fleet/vehicles",             "Flotte — véhicules"),
    ("07-fleet-kyc",                "/franchise/fleet/kyc",                  "Flotte — KYC"),
    ("08-partners-liste",           "/franchise/partners",                   "Partenaires — liste"),
    ("09-partners-new",             "/franchise/partners/new",               "Partenaires — nouveau"),
    ("10-clients-liste",            "/franchise/clients",                    "Clients — liste"),
    ("11-finance",                  "/franchise/finance",                    "Finance — tableau de bord"),
    ("12-finance-commissions",      "/franchise/finance/commissions",        "Finance — commissions"),
    ("13-finance-driver-transfers", "/franchise/finance/driver-transfers",   "Finance — virements chauffeurs"),
    ("14-finance-partner-transfers","/franchise/finance/partner-transfers",  "Finance — virements partenaires"),
    ("15-finance-reconciliation",   "/franchise/finance/reconciliation",     "Finance — réconciliation"),
    ("16-marketing-banners",        "/franchise/marketing/banners",          "Marketing — bannières"),
    ("17-marketing-banners-new",    "/franchise/marketing/banners/new",      "Marketing — nouvelle bannière"),
    ("18-marketing-campaigns",      "/franchise/marketing/campaigns",        "Marketing — campagnes"),
    ("19-marketing-campaigns-new",  "/franchise/marketing/campaigns/new",    "Marketing — nouvelle campagne"),
    ("20-promos-liste",             "/franchise/promos",                     "Promos — liste"),
    ("21-promos-new",               "/franchise/promos/new",                 "Promos — nouveau"),
    ("22-pricing-liste",            "/franchise/pricing",                    "Tarification — liste"),
    ("23-pricing-new",              "/franchise/pricing/new",                "Tarification — nouveau"),
    ("24-territory",                "/franchise/territory",                  "Territoire"),
    ("25-zones",                    "/franchise/zones",                      "Zones"),
    ("26-sos-incidents",            "/franchise/sos/incidents",              "SOS — incidents"),
    ("27-support-tickets",          "/franchise/support/tickets",            "Support — tickets"),
    ("28-support-chat",             "/franchise/support/chat",               "Support — chat"),
    ("29-settings-general",         "/franchise/settings/general",           "Paramètres — général"),
    ("30-settings-weather",         "/franchise/settings/weather",           "Paramètres — météo"),
]

# Pages dynamiques : on prend le 1er lien de détail dans la liste
DYNAMIC_PAGES = [
    ("40-course-detail",        "/franchise/trips",           'a[href^="/franchise/trips/"]:not([href="/franchise/trips"])',                       "Course — détail"),
    ("41-driver-detail",        "/franchise/drivers",         'a[href^="/franchise/drivers/"]:not([href*="moderation"])',                           "Chauffeur — détail"),
    ("42-vehicle-detail",       "/franchise/fleet/vehicles",  'a[href^="/franchise/fleet/vehicles/"]',                                             "Véhicule — détail"),
    ("43-partner-detail",       "/franchise/partners",        'a[href^="/franchise/partners/"]:not([href*="/new"])',                                "Partenaire — détail"),
    ("44-client-detail",        "/franchise/clients",         'a[href^="/franchise/clients/"]',                                                    "Client — détail"),
    ("45-sos-detail",           "/franchise/sos/incidents",   'a[href^="/franchise/sos/incidents/"]',                                              "SOS — détail incident"),
    ("46-ticket-detail",        "/franchise/support/tickets", 'a[href^="/franchise/support/tickets/"]',                                            "Support — détail ticket"),
    ("47-chat-detail",          "/franchise/support/chat",    'a[href^="/franchise/support/chat/"]',                                               "Support — conversation"),
    ("48-pricing-detail",       "/franchise/pricing",         'a[href^="/franchise/pricing/"]:not([href*="/new"])',                                 "Tarification — détail"),
    ("49-promo-detail",         "/franchise/promos",          'a[href^="/franchise/promos/"]:not([href*="/new"])',                                  "Promo — détail"),
]

# ─── Détection d'anomalies ────────────────────────────────────────────────────
BUG_CHECKS = [
    # (description, sélecteur CSS/texte ou None, regex URL ou None)
    ("Redirigé vers login (session expirée ou non authentifié)",            None,                                                         re.compile(r"/franchise/login")),
    ("Erreur Next.js overlay visible",                                       "#__next-error, [data-nextjs-dialog]",                        None),
    ("Composant d'erreur affiché",                                          '[class*="error"]:visible, [class*="Error"]:visible',          None),
    ("Spinner / loader bloqué (données non chargées)",                      '[class*="spinner"]:visible, [class*="Spinner"]:visible, [class*="loading"]:visible', None),
    ("Toast d'erreur affiché",                                              '[class*="toast"][class*="error"]:visible, [data-type="error"]:visible', None),
    ("Page 404 / 403 / Not Found",                                          'h1:has-text("404"), h1:has-text("403"), h1:has-text("Not Found"), h1:has-text("Unauthorized")', None),
    ("Valeur indéfinie affichée (undefined / NaN / null)",                  'text="undefined", text="NaN"',                               None),
]

# ─── Helpers ──────────────────────────────────────────────────────────────────
def wait_ready(page: Page, timeout: int = 20_000):
    try:
        page.wait_for_load_state("networkidle", timeout=timeout)
    except Exception:
        pass
    page.wait_for_timeout(1500)


def login(page: Page):
    """Connexion au portail franchise — vide les champs pré-remplis avant de saisir."""
    page.goto(f"{BASE}/franchise/login", wait_until="domcontentloaded")
    wait_ready(page, 10_000)

    # Forcer les valeurs via JS natif pour déclencher le onChange React
    # React écoute les events natifs : on utilise le setter natif + input event
    page.evaluate(
        """([email, password]) => {
            function setNativeValue(el, value) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                nativeInputValueSetter.call(el, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const emailInput = document.querySelector('input[type="email"]');
            const pwdInput = document.querySelector('input[type="password"]') 
                          || document.querySelector('input[type="text"]');
            if (emailInput) setNativeValue(emailInput, email);
            if (pwdInput) setNativeValue(pwdInput, password);
        }""",
        [EMAIL, PASSWORD]
    )

    page.wait_for_timeout(500)
    page.click('button[type="submit"]')

    # Attendre la redirection vers dashboard
    try:
        page.wait_for_url(re.compile(r"/franchise/dashboard"), timeout=30_000)
    except Exception:
        # Fallback: vérifier si on est toujours sur login
        if "/franchise/login" in page.url:
            print("⚠ Login échoué avec evaluate, tentative avec clavier...")
            page.goto(f"{BASE}/franchise/login", wait_until="domcontentloaded")
            wait_ready(page, 10_000)
            # Sélectionner tout et taper au clavier
            email_input = page.locator('input[type="email"]').first
            email_input.click(click_count=3)
            page.keyboard.press("Backspace")
            email_input.type(EMAIL, delay=30)
            pwd_input = page.locator('input[type="password"]').first
            pwd_input.click(click_count=3)
            page.keyboard.press("Backspace")
            pwd_input.type(PASSWORD, delay=30)
            page.click('button[type="submit"]')
            page.wait_for_url(re.compile(r"/franchise/dashboard"), timeout=30_000)

    wait_ready(page)

    # Vérifier que le cookie auth est bien posé
    cookies = page.context.cookies()
    auth_cookie = [c for c in cookies if c["name"] == "upjunoo_auth"]
    if auth_cookie:
        print(f"✓ Connecté au portail franchise (cookie: {auth_cookie[0]})")
    else:
        # Le cookie n'a pas été posé — le forcer manuellement
        print("⚠ Cookie upjunoo_auth non détecté — injection manuelle")
        page.context.add_cookies([{
            "name": "upjunoo_auth",
            "value": "1",
            "domain": "localhost",
            "path": "/",
            "httpOnly": False,
            "secure": False,
            "sameSite": "Lax"
        }])
    
    # Vérifier localStorage
    has_token = page.evaluate("() => !!localStorage.getItem('upjunoo-auth')")
    if has_token:
        print("  → Token trouvé dans localStorage")
    else:
        print("  ⚠ Token NON trouvé dans localStorage — les pages vont probablement rediriger vers login")


def inject_red_borders(page: Page, selectors_with_bugs: list[str]):
    """Injecte via JS des bordures rouges sur les éléments bugqués avant screenshot."""
    if not selectors_with_bugs:
        return
    for sel in selectors_with_bugs:
        try:
            page.evaluate(
                """(selector) => {
                    const els = document.querySelectorAll(selector);
                    els.forEach(el => {
                        el.style.outline = '4px solid red';
                        el.style.outlineOffset = '2px';
                    });
                }""",
                sel
            )
        except Exception:
            pass


def detect_bugs(page: Page, console_errors: list[str]) -> tuple[list[str], list[str]]:
    """Retourne (liste de descriptions de bugs, liste de sélecteurs CSS à encadrer en rouge)."""
    bugs = []
    red_selectors = []
    current_url = page.url

    for desc, selector, url_regex in BUG_CHECKS:
        # Vérification par URL
        if url_regex and url_regex.search(current_url):
            bugs.append(desc)
            continue

        # Vérification par sélecteur
        if selector:
            try:
                locator = page.locator(selector).first
                if locator.is_visible(timeout=1500):
                    bugs.append(desc)
                    red_selectors.append(selector)
            except Exception:
                pass

    # Erreurs console JS
    relevant = [e for e in console_errors
                if not any(x in e for x in ["favicon", "hot-update", "_next/static", "Warning:"])]
    if relevant:
        bugs.append(f"Erreurs console JS : {' | '.join(relevant[:3])}")

    # Contenu quasi-vide
    try:
        body_text = page.evaluate("() => document.body?.innerText?.trim() ?? ''")
        if len(body_text) < 80:
            bugs.append("Page vide ou quasi-vide (moins de 80 caractères visibles)")
    except Exception:
        pass

    return bugs, red_selectors


def navigate_client_side(page: Page, url: str):
    """Navigation côté client via Next.js router (pas de full reload, pas de middleware redirect)."""
    # Injecter un lien <a> invisible et cliquer dessus pour déclencher le router Next.js
    page.evaluate(
        """(url) => {
            // Utiliser le router Next.js si disponible
            const pushState = window.next?.router?.push;
            if (pushState) {
                pushState(url);
            } else {
                // Fallback: créer un lien et cliquer dessus (soft navigation Next.js)
                const a = document.createElement('a');
                a.href = url;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        }""",
        url
    )
    # Attendre que l'URL change
    try:
        page.wait_for_url(f"**{url}", timeout=10_000)
    except Exception:
        pass
    # Attendre le chargement
    try:
        page.wait_for_load_state("networkidle", timeout=15_000)
    except Exception:
        pass
    page.wait_for_timeout(2000)


def capture_page(page: Page, slug: str, url: str, label: str, console_errors: list[str]) -> dict:
    result = {"slug": slug, "label": label, "url": url, "bugs": [], "screenshot": None, "ok": True}

    try:
        navigate_client_side(page, url)
        wait_ready(page)

        bugs, red_selectors = detect_bugs(page, console_errors)

        if bugs:
            inject_red_borders(page, red_selectors)
            img_path = SCREENS_DIR / f"{slug}.png"
            page.screenshot(path=str(img_path), full_page=True)
            result["screenshot"] = f"screenshots/{slug}.png"
            result["bugs"] = bugs
            result["ok"] = False
            print(f"  ✗ {slug} — {len(bugs)} anomalie(s)")
        else:
            print(f"  ✓ {slug} — OK")

    except PlaywrightError as e:
        result["bugs"] = [f"Erreur Playwright : {str(e)[:300]}"]
        result["ok"] = False
        try:
            img_path = SCREENS_DIR / f"{slug}.png"
            page.screenshot(path=str(img_path), full_page=True)
            result["screenshot"] = f"screenshots/{slug}.png"
        except Exception:
            pass
        print(f"  ✗ {slug} — erreur playwright")
    except Exception as e:
        result["bugs"] = [f"Erreur : {str(e)[:300]}"]
        result["ok"] = False
        print(f"  ✗ {slug} — erreur : {e}")

    console_errors.clear()
    return result


def capture_dynamic(page: Page, slug: str, list_path: str, selector: str, label: str, console_errors: list[str]) -> dict:
    result = {"slug": slug, "label": label, "url": list_path, "bugs": [], "screenshot": None, "ok": True}

    try:
        navigate_client_side(page, list_path)
        wait_ready(page)

        link = page.locator(selector).first
        count = link.count()
        if count == 0:
            result["bugs"] = ["Aucun lien de détail trouvé dans la liste (liste vide ou sélecteur non concordant)"]
            result["ok"] = False
            img_path = SCREENS_DIR / f"{slug}.png"
            page.screenshot(path=str(img_path), full_page=True)
            result["screenshot"] = f"screenshots/{slug}.png"
            print(f"  ✗ {slug} — liste vide")
            return result

        href = link.get_attribute("href")
        if not href:
            raise ValueError("href manquant sur le lien détail")

        return capture_page(page, slug, href, label, console_errors)

    except Exception as e:
        result["bugs"] = [f"Erreur : {str(e)[:300]}"]
        result["ok"] = False
        try:
            img_path = SCREENS_DIR / f"{slug}.png"
            page.screenshot(path=str(img_path), full_page=True)
            result["screenshot"] = f"screenshots/{slug}.png"
        except Exception:
            pass
        print(f"  ✗ {slug} — erreur : {e}")
        return result


# ─── Génération Markdown ──────────────────────────────────────────────────────
def generate_markdown(results: list[dict], report_date: str) -> str:
    broken = [r for r in results if not r["ok"]]
    ok     = [r for r in results if r["ok"]]

    lines = [
        "# Rapport de corrections — Portail Franchise",
        "",
        f"**Date :** {report_date}  ",
        f"**Base URL :** {BASE}  ",
        f"**Pages testées :** {len(results)}  ",
        f"**Pages avec anomalies :** {len(broken)}  ",
        f"**Pages OK :** {len(ok)}  ",
        "",
        "---",
        "",
    ]

    if not broken:
        lines.append("## ✅ Aucune anomalie détectée")
        lines.append("")
        lines.append("Toutes les pages fonctionnent correctement.")
        return "\n".join(lines)

    lines.append(f"## Pages avec anomalies ({len(broken)})")
    lines.append("")

    for r in broken:
        lines.append(f"### {r['label']}")
        lines.append("")
        lines.append(f"**Route :** `{r['url']}`  ")
        if r["screenshot"]:
            lines.append(f"**Capture :** ![{r['label']}]({r['screenshot']})")
        lines.append("")
        lines.append("**Ce qui ne fonctionne pas :**")
        lines.append("")
        for bug in r["bugs"]:
            lines.append(f"- {bug}")
        lines.append("")
        lines.append("---")
        lines.append("")

    if ok:
        lines.append(f"## Pages OK ({len(ok)})")
        lines.append("")
        for r in ok:
            lines.append(f"- ✅ `{r['url']}` — {r['label']}")

    return "\n".join(lines)


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    report_date = date.today().isoformat()
    results: list[dict] = []
    console_errors: list[str] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
        )
        page = context.new_page()

        # Collecte des erreurs console
        def on_console(msg):
            if msg.type == "error":
                console_errors.append(msg.text[:200])
        def on_page_error(exc):
            console_errors.append(f"[pageerror] {str(exc)[:200]}")

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        print(f"\nBase URL : {BASE}")
        print(f"Sortie   : {REPORT_DIR}\n")

        login(page)

        print("\n── Pages statiques ─────────────────────────────────────────────")
        for slug, path_url, label in STATIC_PAGES:
            r = capture_page(page, slug, path_url, label, console_errors)
            results.append(r)

        print("\n── Pages dynamiques (détails) ───────────────────────────────────")
        for slug, list_path, selector, label in DYNAMIC_PAGES:
            r = capture_dynamic(page, slug, list_path, selector, label, console_errors)
            results.append(r)

        browser.close()

    # Écriture du rapport Markdown
    md_content = generate_markdown(results, report_date)
    md_path = REPORT_DIR / f"rapport-corrections-franchise-{report_date}.md"
    md_path.write_text(md_content, encoding="utf-8")

    broken = sum(1 for r in results if not r["ok"])
    print(f"\n{'─' * 60}")
    print(f"Terminé : {len(results) - broken}/{len(results)} pages OK")
    print(f"Anomalies : {broken} page(s)")
    print(f"Rapport   : {md_path}")
    print(f"{'─' * 60}\n")


if __name__ == "__main__":
    main()
