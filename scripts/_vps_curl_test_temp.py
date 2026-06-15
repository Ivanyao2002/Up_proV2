import os, paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("194.29.101.141", username="sysadmin", password=os.environ["VPS_PASSWORD"], timeout=30, look_for_keys=False, allow_agent=False)
for cmd in [
    "curl -sI http://127.0.0.1:3006/pro | head -15",
    "curl -sI http://127.0.0.1:3006/pro/admin/login | head -15",
    "curl -sI http://127.0.0.1:3006/pro/admin/login/ | head -15",
]:
    print("===", cmd)
    _, o, _ = c.exec_command(cmd, timeout=20)
    o.channel.recv_exit_status()
    print(o.read().decode())
c.close()
