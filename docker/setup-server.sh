#!/bin/bash
# One-time bootstrap for a fresh Ubuntu 24.04 Azure VM.
# Run with sudo (as your Azure admin user) once, before the first CD deploy.
set -euo pipefail

# --- Firewall (defense in depth; also open 22/80/443 in the Azure Network
# Security Group for this VM from the Azure Portal, ufw alone isn't enough) --
apt-get update
apt-get install -y ufw fail2ban
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# --- Docker ---------------------------------------------------------------
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# Explicit, not assumed - this is what makes containers with `restart: unless-stopped`
# come back automatically after the VM is deallocated (stopped) and started again.
systemctl enable docker

# --- Deploy user ------------------------------------------------------------
# Azure VMs use a custom admin user (not root SSH login), so we copy that
# user's authorized_keys as a starting point rather than assuming /root exists.
ADMIN_HOME="$(eval echo ~"${SUDO_USER:-root}")"

if ! id -u deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  mkdir -p /home/deploy/.ssh
  cp "$ADMIN_HOME/.ssh/authorized_keys" /home/deploy/.ssh/authorized_keys 2>/dev/null || true
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
fi

mkdir -p /opt/zeno
chown deploy:deploy /opt/zeno

cat <<'EOF'
Server bootstrap done.

Next steps:
  1. Generate a dedicated deploy keypair on your machine (not your personal key):
       ssh-keygen -t ed25519 -f zeno_deploy_key -C "github-actions-deploy"
     Append zeno_deploy_key.pub to /home/deploy/.ssh/authorized_keys on this server,
     and store the private key as the AZURE_VM_SSH_KEY GitHub secret.

  2. Create /opt/zeno/.env by hand (see docker/env.production.example for the full
     list of keys: APP_KEY, DB_*, DB_ROOT_PASSWORD, MAIL_*, GOOGLE_*, MONGODB_URI,
     REVERB_*, AWS_* for R2 storage, APP_DOMAIN, REVERB_DOMAIN, ACME_EMAIL) and set
     APP_ENV=production, APP_DEBUG=false. This file is never touched by CI/CD.

  3. Push to main (or run the deploy workflow manually) to trigger the first deploy.
EOF
