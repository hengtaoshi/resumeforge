import paramiko, sys, io, json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('124.221.92.130', username='root', password='Shi08071209')

for tag in ['v1.6.1', 'v1.6.0']:
    stdin, stdout, stderr = ssh.exec_command(f'curl -s https://api.github.com/repos/hengtaoshi/resumeforge/releases/tags/{tag}')
    raw = stdout.read().decode('utf-8', errors='replace')
    try:
        d = json.loads(raw)
        print(f'=== {tag} ===')
        assets = d.get('assets', [])
        if assets:
            for a in assets:
                print(f'  {a["name"]}: {a["size"]} bytes')
        else:
            print('  (no assets)')
            print(f'  draft: {d.get("draft")}, prerelease: {d.get("prerelease")}')
    except Exception as e:
        print(f'=== {tag} === parse error: {e}')
        print(raw[:300])
    print()

ssh.close()
