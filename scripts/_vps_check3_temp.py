import os, paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("194.29.101.141", username="sysadmin", password=os.environ["VPS_PASSWORD"], timeout=30, look_for_keys=False, allow_agent=False)
_, o, _ = c.exec_command("grep briefing /opt/apps/upjunoo-pro-backoffice/src/features/assistant/api/assistant.service.ts", timeout=30)
o.channel.recv_exit_status()
print(o.read().decode())
c.close()
