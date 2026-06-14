# wwxriyy bio

Clean Django bio site for `wwxriyy.com`.

Production path: `/opt/wwxriyy-bio`.

## Local Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

## Deploy Summary

Production stack:

- Git for delivery
- Gunicorn as the Django app server
- Nginx as reverse proxy
- Certbot for SSL

Do not commit `.env`. Create it on the server from `.env.example`.

## Useful Files

- `deploy/nginx.conf`
- `deploy/wwxriyy-bio.service`
- `.env.example`
