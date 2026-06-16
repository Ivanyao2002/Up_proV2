#!/usr/bin/env python3
"""Déploie le backoffice sur le VPS : sync sources, build Docker, purge cache."""
from __future__ import annotations

import os
import re
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
REMOTE_APP = "/opt/apps/upjunoo-pro-backoffice"
REMOTE_DEPLOY = f"{REMOTE_APP}/deploy/upjunoo-pro"
HOST = os.environ.get("VPS_HOST", "194.29.101.141")
USER = os.environ.get("VPS_USER", "sysadmin")
PASSWORD = os.environ.get("VPS_PASSWORD", "")

SKIP_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "terminals",
    "__pycache__",
}
SKIP_FILES = {".env"}


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def format_env_line(key: str, value: str) -> str:
    if re.search(r'[\s#"\'$`\\]', value):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'{key}="{escaped}"'
    return f"{key}={value}"


def build_env_runtime(local_env: dict[str, str]) -> str:
    """Construit .env.runtime VPS à partir de .env.local (sans secrets dev-only)."""
    skip_keys = {
        "NEXT_PUBLIC_DEV_ADMIN_EMAIL",
        "NEXT_PUBLIC_DEV_ADMIN_PASSWORD",
    }
    keys = [
        "NEXT_PUBLIC_BASE_PATH",
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_USE_MOCKS",
        "NEXT_PUBLIC_USE_REAL_AUTH",
        "NEXT_PUBLIC_APP_NAME",
        "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
        "NEXT_PUBLIC_LIVE_MAP_PROVIDER",
        "NEXT_PUBLIC_DOCUMENT_EXTRACT_PROVIDER",
        "LLM_BASE_URL",
        "LLM_MODEL",
        "OPENROUTER_API_KEY",
        "OPENROUTER_MODEL",
        "OPENROUTER_STRUCTURE_MODEL",
        "DOCUMENT_EXTRACT_PROVIDER",
        "PADDLE_OCR_BASE_URL",
    ]
    lines: list[str] = []
    for key in keys:
        if key in skip_keys:
            continue
        value = local_env.get(key)
        if not value:
            continue
        lines.append(format_env_line(key, value))
    if not any(line.startswith("NEXT_PUBLIC_BASE_PATH=") for line in lines):
        lines.insert(0, "NEXT_PUBLIC_BASE_PATH=/pro")
    if not any(line.startswith("LLM_BASE_URL=") for line in lines):
        lines.append("LLM_BASE_URL=https://uat.upjunoo.com/llm-api")
    if not any(line.startswith("LLM_MODEL=") for line in lines):
        lines.append("LLM_MODEL=qwen2.5:7b-instruct-q4_K_M")
    if not any(line.startswith("PADDLE_OCR_BASE_URL=") for line in lines):
        lines.append("PADDLE_OCR_BASE_URL=https://uat.upjunoo.com/ocr-api")
    if not any(line.startswith("DOCUMENT_EXTRACT_PROVIDER=") for line in lines):
        lines.append("DOCUMENT_EXTRACT_PROVIDER=paddle")
    return "\n".join(lines) + "\n"


def upload_env_runtime(client: paramiko.SSHClient, content: str) -> None:
    import base64

    remote = f"{REMOTE_DEPLOY}/.env.runtime"
    b64 = base64.b64encode(content.encode("utf-8")).decode("ascii")
    run(client, f"mkdir -p {REMOTE_DEPLOY}")
    run(client, f"echo {b64} | base64 -d > {remote}")
    run(client, f"chmod 600 {remote} 2>/dev/null || true")
    print("\n===== .env.runtime (clés, sans valeurs) =====")
    for line in content.splitlines():
        key = line.split("=", 1)[0]
        print(f"  {key}=***")


def ensure_env_runtime(client: paramiko.SSHClient) -> None:
    local_env = parse_env_file(ROOT / ".env.local")
    content = build_env_runtime(local_env)
    upload_env_runtime(client, content)


def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    if parts & SKIP_DIRS:
        return True
    if path.name in SKIP_FILES:
        return True
    if path.name == ".env.local":
        return True
    if path.name.startswith("scripts/_") and path.suffix == ".py":
        return True
    if path.suffix == ".tar.gz":
        return True
    return False


def create_source_tar() -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    tmp.close()
    tar_path = Path(tmp.name)
    print(f"Archive locale : {tar_path}")
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in ROOT.rglob("*"):
            rel = item.relative_to(ROOT)
            if should_skip(item):
                continue
            if any(p in SKIP_DIRS for p in rel.parts):
                continue
            tar.add(item, arcname=str(rel).replace("\\", "/"))
    size_mb = tar_path.stat().st_size / (1024 * 1024)
    print(f"Taille archive : {size_mb:.1f} Mo")
    return tar_path


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 900) -> tuple[int, str]:
    print(f"\n$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    combined = (out + err).strip()
    if combined:
        # Avoid Windows console encoding issues
        safe = combined.encode("ascii", errors="replace").decode("ascii")
        print(safe[-8000:] if len(safe) > 8000 else safe)
    return code, combined


def main() -> int:
    if not PASSWORD:
        print("VPS_PASSWORD requis.", file=sys.stderr)
        return 1

    tar_path = create_source_tar()
    remote_tar = "/tmp/upjunoo-backoffice-deploy.tar.gz"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )

    try:
        print("\n===== DISQUE AVANT =====")
        run(client, "df -h / | tail -1")

        print("\n===== UPLOAD =====")
        sftp = client.open_sftp()
        sftp.put(str(tar_path), remote_tar)
        sftp.close()

        print("\n===== EXTRACTION =====")
        run(
            client,
            f"mkdir -p /tmp/upjunoo-deploy-extract && rm -rf /tmp/upjunoo-deploy-extract/*",
        )
        code, _ = run(
            client,
            f"tar -xzf {remote_tar} -C /tmp/upjunoo-deploy-extract",
            timeout=300,
        )
        if code != 0:
            return code

        run(
            client,
            f"cp -rf /tmp/upjunoo-deploy-extract/. {REMOTE_APP}/",
            timeout=300,
        )

        ensure_env_runtime(client)
        run(client, f"sed -i 's/\\r$//' {REMOTE_DEPLOY}/rebuild.sh")
        run(client, f"chmod +x {REMOTE_DEPLOY}/rebuild.sh")

        print("\n===== BUILD + DEPLOY (peut prendre 10-15 min) =====")
        code, _ = run(
            client,
            f"cd {REMOTE_DEPLOY} && bash rebuild.sh",
            timeout=1800,
        )
        if code != 0:
            print("Build/deploy echoue.", file=sys.stderr)
            return code

        print("\n===== VERIFICATION =====")
        time.sleep(5)
        run(client, "docker ps --filter name=upjunoo-pro-backoffice --format '{{.Names}} {{.Status}}'")
        run(client, "curl -s -o /dev/null -w 'HTTP /pro/ -> %{http_code}\\n' http://127.0.0.1:3006/pro/")
        run(
            client,
            "curl -s -o /dev/null -w 'asset orange -> %{http_code}\\n' "
            "http://127.0.0.1:3006/pro/assets/icon/orange.png",
        )
        run(
            client,
            "curl -s -o /dev/null -w 'assistant -> %{http_code} %{content_type}\\n' "
            "-X POST http://127.0.0.1:3006/pro/api/admin/assistant "
            "-H 'Content-Type: application/json' -d '{\"messages\":[]}'",
        )
        run(client, "docker system df")
        run(client, "df -h / | tail -1")

        run(client, f"rm -f {remote_tar}")
        print("\nDeploy termine.")
        return 0
    finally:
        client.close()
        try:
            tar_path.unlink(missing_ok=True)
        except OSError:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
