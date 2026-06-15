"""Corrige la boucle de redirection /pro ↔ /pro/ sur nginx UAT."""
from __future__ import annotations

import base64
import os
import re
import sys

import paramiko

HOST = os.environ.get("VPS_HOST", "194.29.101.141")
USER = os.environ.get("VPS_USER", "sysadmin")
PASSWORD = os.environ.get("VPS_PASSWORD", "")
NGINX_FILE = "/etc/nginx/sites-enabled/uat.upjunoo.com"
BACKUP = "/tmp/uat.upjunoo.com.bak-pro-fix"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 120) -> tuple[int, str]:
    print(f"\n$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = (stdout.read() + stderr.read()).decode("utf-8", errors="replace").strip()
    if out:
        print(out[-4000:])
    return code, out


def main() -> int:
    if not PASSWORD:
        print("VPS_PASSWORD manquant", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False
    )

    # Nettoyer backup erroné dans sites-enabled
    run(client, f"sudo rm -f {NGINX_FILE}.bak-pro-fix")

    _, content = run(client, f"sudo cat {NGINX_FILE}")
    if not content:
        return 1

    run(client, f"sudo cp {NGINX_FILE} {BACKUP}")

    # Supprimer redirect /pro → /pro/
    content = re.sub(
        r"\n\s*location\s*=\s*/pro\s*\{[^}]*\}\s*",
        "\n",
        content,
        flags=re.DOTALL,
    )

    # location /pro/ → location /pro (match aussi /pro sans slash)
    content = re.sub(r"location\s+/pro/\s*\{", "location /pro {", content)

    b64 = base64.b64encode(content.encode("utf-8")).decode("ascii")
    code, _ = run(
        client,
        f"echo {b64} | base64 -d | sudo tee {NGINX_FILE} > /dev/null",
    )
    if code != 0:
        run(client, f"sudo cp {BACKUP} {NGINX_FILE}")
        return code

    code, _ = run(client, "sudo nginx -t")
    if code != 0:
        run(client, f"sudo cp {BACKUP} {NGINX_FILE}")
        run(client, "sudo nginx -t")
        return code

    run(client, "sudo systemctl reload nginx")

    for url in [
        "curl -sI http://127.0.0.1:3006/pro/ | head -5",
        "curl -sI http://127.0.0.1:3006/pro | head -5",
        "curl -sI https://uat.upjunoo.com/pro/ 2>&1 | head -10",
        "curl -sI https://uat.upjunoo.com/pro 2>&1 | head -10",
        "curl -sI https://uat.upjunoo.com/pro/admin/login 2>&1 | head -10",
    ]:
        run(client, url)

    client.close()
    print("\nNginx corrigé.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
