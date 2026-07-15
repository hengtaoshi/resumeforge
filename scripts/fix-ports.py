import paramiko, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('124.221.92.130', username='root', password='Shi08071209')
sftp = ssh.open_sftp()

cfg = "server {\n    listen 9084;\n    server_name resumeforge.hengtaoyuan.asia;\n    root /www/wwwroot/resumeforge;\n    index index.html;\n    location /download/ { alias /www/wwwroot/resumeforge/download/; autoindex off; }\n    location /updates/ { alias /www/wwwroot/resumeforge/updates/; autoindex off; }\n    location / { try_files $uri $uri/ /index.html; }\n}\n"
with sftp.open('/www/server/panel/vhost/nginx/resumeforge.conf', 'w') as f:
    f.write(cfg)
ssh.exec_command('/www/server/nginx/sbin/nginx -s reload')
time.sleep(1)
print('nginx ok')

ssh.exec_command('fuser -k 8080/tcp 2>/dev/null; sleep 1')
ssh.exec_command('docker compose -f /data/safeline/docker-compose.yaml up -d tengine 2>&1')
time.sleep(8)

r = ssh.exec_command('docker ps --filter name=tengine --format "{{.Names}} {{.Status}}"')
print('tengine:', r[1].read().decode().strip())

for url in ['https://psw.hengtaoyuan.asia/', 'https://sy.hengtaoyuan.asia/', 'https://hengtaoyuan.asia/', 'https://api.hengtaoyuan.asia/']:
    r = ssh.exec_command(f'curl -sk -o /dev/null -w "%{{http_code}}" {url}')
    print(url, 'HTTP', r[1].read().decode().strip())

sftp.close()
ssh.close()
