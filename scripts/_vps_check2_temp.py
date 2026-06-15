import os, paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("194.29.101.141", username="sysadmin", password=os.environ["VPS_PASSWORD"], timeout=30, look_for_keys=False, allow_agent=False)
cmds = [
    "test -f /opt/apps/upjunoo-pro-backoffice/src/shared/lib/basePath.ts && echo BASEPATH_OK",
    "grep withBasePath /opt/apps/upjunoo-pro-backoffice/src/features/assistant/api/assistant.service.ts | head -5",
    "curl -sI https://uat.upjunoo.com/pro/assets/icon/orange.png | head -5",
    "curl -s -o /tmp/pub.out -w 'pub:%{http_code} %{content_type}\\n' -X POST https://uat.upjunoo.com/pro/api/admin/assistant -H 'Content-Type: application/json' -d '{\"messages\":[]}' && head -c 80 /tmp/pub.out",
]
for cmd in cmds:
    print("---", cmd)
    _, o, _ = c.exec_command(cmd, timeout=60)
    o.channel.recv_exit_status()
    print(o.read().decode())
c.close()
