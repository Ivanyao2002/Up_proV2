import os, paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("194.29.101.141", username="sysadmin", password=os.environ["VPS_PASSWORD"], timeout=30, look_for_keys=False, allow_agent=False)
cmds = [
    "sudo cat /etc/nginx/sites-enabled/uat.upjunoo.com",
    "curl -sI http://127.0.0.1:3006/pro/ | head -20",
    "curl -sI http://127.0.0.1:3006/pro/admin/dashboard | head -20",
    "curl -sI http://127.0.0.1:3006/ | head -10",
    "curl -sI https://uat.upjunoo.com/pro/ 2>/dev/null | head -20 || curl -sI http://uat.upjunoo.com/pro/ | head -20",
    "docker logs upjunoo-pro-backoffice --tail 30 2>&1",
    "cat /opt/apps/upjunoo-pro-backoffice/deploy/upjunoo-pro/.env.runtime",
]
for cmd in cmds:
    print(f"\n=== {cmd[:80]} ===")
    _, o, e = c.exec_command(cmd, timeout=30)
    o.channel.recv_exit_status()
    out = (o.read() + e.read()).decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode()[:8000])
c.close()
