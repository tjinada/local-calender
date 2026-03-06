#!/bin/bash
# ============================================
# Family Hub — Raspberry Pi 4 Kiosk Setup
# ============================================
# Run this script on a fresh Raspbian Lite install.
# Usage: sudo bash pi-kiosk-setup.sh <FAMILY_HUB_URL>
# Example: sudo bash pi-kiosk-setup.sh http://192.168.0.243:8086

set -e

HUB_URL="${1:-http://192.168.0.243:8086}"

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

# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Hide cursor after 3 seconds of inactivity
unclutter -idle 3 -root &

# Wait for network connectivity before launching browser
while ! ping -c 1 -W 2 192.168.0.243 > /dev/null 2>&1; do
  echo "Waiting for network..."
  sleep 2
done

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
  --enable-features=OverlayScrollbar \\
  --force-device-scale-factor=1.0 \\
  --touch-events=enabled \\
  --enable-touch-drag-drop \\
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

# Rotate screen if needed (landscape is default for UPERFECT 18.5")
# Uncomment the line below if your display is mounted in portrait:
# echo "display_rotate=1" >> /boot/config.txt

# GPU memory for smoother rendering
if ! grep -q "gpu_mem=" /boot/config.txt; then
  echo "gpu_mem=128" >> /boot/config.txt
fi

# Disable Raspberry Pi splash screen for cleaner boot
if ! grep -q "disable_splash" /boot/config.txt; then
  echo "disable_splash=1" >> /boot/config.txt
fi

# Nightly reboot at 3 AM for stability
(crontab -l 2>/dev/null; echo "0 3 * * * /sbin/reboot") | crontab -

# Auto-restart Chromium if it crashes
cat > /home/kiosk/watchdog.sh << 'WATCHDOG'
#!/bin/bash
while true; do
  if ! pgrep -x "chromium-browse" > /dev/null; then
    echo "Chromium crashed, restarting X..."
    sudo systemctl restart getty@tty1
  fi
  sleep 30
done
WATCHDOG
chown kiosk:kiosk /home/kiosk/watchdog.sh
chmod +x /home/kiosk/watchdog.sh

# Add watchdog to cron
(crontab -u kiosk -l 2>/dev/null; echo "@reboot /home/kiosk/watchdog.sh &") | crontab -u kiosk -

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The Pi will auto-boot into full-screen Chromium showing:"
echo "  $HUB_URL"
echo ""
echo "To change the URL later, edit /home/kiosk/.xinitrc"
echo "To adjust zoom, change --force-device-scale-factor in .xinitrc"
echo "  (try 1.1 or 1.2 if text feels small)"
echo ""
echo "Reboot now: sudo reboot"
