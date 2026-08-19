# On your EC2 instance
git pull
cp .env.example .env  # fill in real secrets

docker compose build --no-cache
docker compose up -d

# Nginx + SSL
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl reload nginx
