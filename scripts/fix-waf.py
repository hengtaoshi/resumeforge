import paramiko, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('124.221.92.130', username='root', password='Shi08071209')

safeline = """log_format safeline_7 '$remote_addr | $remote_user | $time_local | "$host" | '
                    "$request" | $status | $body_bytes_sent | '
                    "$http_referer" | "$http_user_agent"';
upstream backend_7 {
    server 127.0.0.1:9084;
    keepalive 128; keepalive_timeout 75;
}
map $scheme $hsts_header { https "max-age=15768000;"; }
server {
    listen 0.0.0.0:80;
    server_name resumeforge.hengtaoyuan.asia;
    return 301 https://$host:443$request_uri;
}
server {
    listen 0.0.0.0:443 ssl http2;
    server_name resumeforge.hengtaoyuan.asia;
    ssl_certificate /etc/nginx/certs/cert_3.crt;
    ssl_certificate_key /etc/nginx/certs/cert_3.key;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    error_page 497 =302 https://$host:$server_port$request_uri;
    error_page 502 =502 /.safeline/bad_gateway_page;
    error_page 504 =504 /.safeline/gateway_timeout_page;
    set $should_rewrite 0;
    if ($host !~* ^(resumeforge\.hengtaoyuan\.asia)$) { set $should_rewrite 1; }
    if ($should_rewrite) { rewrite ^ /.safeline/not_found_page last; }
    gzip on; brotli on;
    location ^~ / {
        proxy_pass http://backend_7;
        include proxy_params;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header Strict-Transport-Security $hsts_header always;
        t1k_intercept off;
        tx_intercept off;
    }
}
"""
with ssh.open_sftp().open('/data/safeline/resources/nginx/sites-enabled/IF_backend_7', 'w') as f:
    f.write(safeline)

ssh.exec_command('mkdir -p /data/safeline/resources/nginx/tamper-enabled/site_7')
ssh.exec_command('touch /data/safeline/resources/nginx/tamper-enabled/site_7/tamper_default')
ssh.exec_command('touch /data/safeline/resources/nginx/custom_params/backend_7')

ssh.exec_command('docker exec safeline-tengine nginx -s reload')
time.sleep(2)

r = ssh.exec_command('curl -sk -o /dev/null -w "%{http_code}" --resolve resumeforge.hengtaoyuan.asia:443:127.0.0.1 https://resumeforge.hengtaoyuan.asia/')
print('Site:', r[1].read().decode().strip())

r2 = ssh.exec_command('timeout 5 curl -sk -o /dev/null -w "%{speed_download}" --resolve resumeforge.hengtaoyuan.asia:443:127.0.0.1 https://resumeforge.hengtaoyuan.asia/download/ResumeForge-1.6.1-Setup.exe 2>&1 || true')
print('Download:', r2[1].read().decode().strip()[:100])

for url in ['https://psw.hengtaoyuan.asia/', 'https://sy.hengtaoyuan.asia/', 'https://hengtaoyuan.asia/', 'https://api.hengtaoyuan.asia/']:
    r = ssh.exec_command(f'curl -sk -o /dev/null -w "%{{http_code}}" {url}')
    print(url, 'HTTP', r[1].read().decode().strip())

ssh.close()
