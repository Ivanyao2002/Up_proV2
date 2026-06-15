"""Vérifie état VPS backoffice + endpoints assistant/assets."""
from __future__ import annotations

import os
import sys

import paramiko

HOST = os.environ.get("VPS_HOST", "194.29.101.141")
USER = os.environ.get("VPS_USER", "sysadmin")
PASSWORD = os.environ.get("VPS_PASSWORD", "")


def run(client: paramiko.SSHClient, cmd: str) -> None:
    print(f"\n$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=120)
    stdout.channel.recv_exit_status()
    out = (stdout.read() + stderr.read()).decode("utf-8", errors="replace").strip()
    if out:
        print(out[-3000:])


def main() -> int:
    if not PASSWORD:
        print("VPS_PASSWORD manquant", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)

    cmds = [
        "docker ps --filter name=upjunoo-pro-backoffice --format '{{.Names}} {{.Status}}'",
        "cat /opt/apps/upjunoo-pro-backoffice/deploy/upjunoo-pro/.env.runtime",
        "docker exec upjunoo-pro-backoffice printenv | sort | grep -E '^(LLM_|PADDLE_|DOCUMENT_|OPENROUTER_|NEXT_PUBLIC_BASE_PATH=)'",
        "curl -sI http://127.0.0.1:3006/pro/assets/icon/orange.png | head -6",
        "curl -sI http://127.0.0.1:3006/assets/icon/orange.png | head -4",
        "curl -s -o /tmp/asst.out -w 'code:%{http_code} type:%{content_type}\\n' -X POST http://127.0.0.1:3006/pro/api/admin/assistant -H 'Content-Type: application/json' -d '{\"messages\":[]}' && head -c 120 /tmp/asst.out",
        "curl -s -o /tmp/asst_bad.out -w 'code:%{http_code} type:%{content_type}\\n' -X POST http://127.0.0.1:3006/api/admin/assistant -H 'Content-Type: application/json' -d '{\"messages\":[]}' && head -c 80 /tmp/asst_bad.out",
        "ps aux | grep -E 'deploy-backoffice|docker compose build' | grep -v grep | head -5",
    ]
    for cmd in cmds:
        run(client, cmd)

    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
