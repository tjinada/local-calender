#!/bin/bash
# ============================================
# Family Hub — Raspberry Pi 4 Kiosk Setup
# ============================================
# Run this script on a fresh Raspbian Lite install.
# Usage: sudo bash pi-kiosk-setup.sh <FAMILY_HUB_URL>
# Example: sudo bash pi-kiosk-setup.sh http://192.168.1.100:8088

set -e

HUB_URL="${1:-http://localhost:8088}"

echo "=== Family Hub Kiosk Setup ==="
echo "Target URL: $HUB_URL"

# Update system
apt-get update && apt-get upgrade -y

# Install X server, Chromium, and utilities
apt-get install -y --no-install-recommends \
  xserver-xorg x11-xserver-utils xinit \
  chromium-browser \
  unclutter \
  sed

# Create kiosk user if it doesn't exist
if ! id -u kiosk >/dev/null 2>&1; then
  useradd -m -s /bin/bash kiosk
fi

# Autologin on tty1
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin kiosk --noclear %I \$TERM
EOF

# Create .xinitrc for kiosk user
cat > /home/kiosk/.xinitrc << EOF
#!/bin/bash

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide cursor after 3 seconds of inactivity
unclutter -idle 3 -root &

# Start Chromium in kiosk mode
chromium-browser \\
  --noerrdialogs \\
  --disable-infobars \\
  --kiosk \\
  --incognito \\
  --disable-translate \\
  --disable-features=TranslateUI \\
  --overscroll-history-navigation=0 \\
  --disable-pinch \\
  --no-first-run \\
  --disable-session-crashed-bubble \\
  --autoplay-policy=no-user-gesture-required \\
  --check-for-update-interval=31536000 \\
  "$HUB_URL"
EOF
chown kiosk:kiosk /home/kiosk/.xinitrc
chmod +x /home/kiosk/.xinitrc

# Auto-start X on login
cat > /home/kiosk/.bash_profile << 'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx -- -nocursor 2>/dev/null
fi
EOF
chown kiosk:kiosk /home/kiosk/.bash_profile

# Optional: nightly reboot at 3 AM for stability
(crontab -l 2>/dev/null; echo "0 3 * * * /sbin/reboot") | crontab -

echo ""
echo "=== Setup Complete ==="
echo "Reboot to start kiosk mode: sudo reboot"
echo "The Pi will auto-boot into Chromium showing: $HUB_URL"
