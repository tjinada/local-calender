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

# Install X server, Chromium, virtual keyboard, and utilities
apt-get install -y --no-install-recommends \
  xserver-xorg x11-xserver-utils xinit \
  unclutter \
  sed
apt-get install -y chromium || apt-get install -y chromium-browser

# Install squeekboard (Wayland on-screen keyboard) or onboard (X11)
apt-get install -y onboard || true

# Detect which Chromium binary is available
CHROMIUM_BIN=$(which chromium || which chromium-browser)
echo "Using Chromium at: $CHROMIUM_BIN"

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

# Force HDMI output at 1920x1080 for UPERFECT display
if ! grep -q "hdmi_force_hotplug" /boot/firmware/config.txt 2>/dev/null && ! grep -q "hdmi_force_hotplug" /boot/config.txt 2>/dev/null; then
  # Determine which config.txt to use
  CONFIG_FILE="/boot/config.txt"
  [ -f "/boot/firmware/config.txt" ] && CONFIG_FILE="/boot/firmware/config.txt"

  cat >> "$CONFIG_FILE" << 'HDMI'

# Family Hub - Force HDMI output for UPERFECT 18.5" display
hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=82
hdmi_drive=2
disable_overscan=1
HDMI
  echo "HDMI config added to $CONFIG_FILE"
fi

# Create .xinitrc for kiosk user
cat > /home/kiosk/.xinitrc << XINIT
#!/bin/bash

# Get screen resolution
SCREEN_RES=\$(xrandr | grep '*' | head -1 | awk '{print \$1}')
echo "Screen resolution: \$SCREEN_RES"

# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Hide cursor after 3 seconds of inactivity
unclutter -idle 3 -root &

# Start onboard virtual keyboard (auto-show on text focus)
if command -v onboard &> /dev/null; then
  # Configure onboard to auto-show
  mkdir -p /home/kiosk/.config/dconf
  dbus-launch onboard --xid &
  sleep 1
fi

# Wait for network connectivity before launching browser
while ! ping -c 1 -W 2 192.168.0.243 > /dev/null 2>&1; do
  echo "Waiting for network..."
  sleep 2
done

# Start Chromium in kiosk mode - full screen
$CHROMIUM_BIN \\
  --noerrdialogs \\
  --disable-infobars \\
  --kiosk \\
  --start-fullscreen \\
  --start-maximized \\
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
  --window-size=1920,1080 \\
  --window-position=0,0 \\
  "$HUB_URL"
XINIT
chown kiosk:kiosk /home/kiosk/.xinitrc
chmod +x /home/kiosk/.xinitrc

# Configure onboard for auto-show on text input focus
mkdir -p /home/kiosk/.config/onboard
cat > /home/kiosk/.config/onboard/onboard-defaults.conf << 'ONBOARD'
[main]
layout=Compact
theme=Nightshade
start-minimized=true
show-status-icon=false
xembed-onboard=true

[auto-show]
enabled=true

[window]
docking-enabled=true
force-to-top=true
ONBOARD
chown -R kiosk:kiosk /home/kiosk/.config

# Create a dconf settings file for onboard auto-show
mkdir -p /home/kiosk/.config/dconf
cat > /home/kiosk/setup-onboard.sh << 'SETUP'
#!/bin/bash
export DISPLAY=:0
dbus-launch gsettings set org.onboard auto-show-enabled true 2>/dev/null || true
dbus-launch gsettings set org.onboard.window docking-enabled true 2>/dev/null || true
SETUP
chown kiosk:kiosk /home/kiosk/setup-onboard.sh
chmod +x /home/kiosk/setup-onboard.sh

# Auto-start X on login
cat > /home/kiosk/.bash_profile << 'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx -- -nocursor 2>/dev/null
fi
EOF
chown kiosk:kiosk /home/kiosk/.bash_profile

# Determine config.txt location
CONFIG_FILE="/boot/config.txt"
[ -f "/boot/firmware/config.txt" ] && CONFIG_FILE="/boot/firmware/config.txt"

# GPU memory for smoother rendering
if ! grep -q "gpu_mem=" "$CONFIG_FILE"; then
  echo "gpu_mem=128" >> "$CONFIG_FILE"
fi

# Disable Raspberry Pi splash screen for cleaner boot
if ! grep -q "disable_splash" "$CONFIG_FILE"; then
  echo "disable_splash=1" >> "$CONFIG_FILE"
fi

# Nightly reboot at 3 AM for stability
(crontab -l 2>/dev/null; echo "0 3 * * * /sbin/reboot") | crontab -

# Auto-restart Chromium if it crashes
cat > /home/kiosk/watchdog.sh << 'WATCHDOG'
#!/bin/bash
while true; do
  if ! pgrep -f "chromium" > /dev/null; then
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
echo "Onboard virtual keyboard will appear when you tap text inputs."
echo ""
echo "To change the URL later, edit /home/kiosk/.xinitrc"
echo "To adjust zoom, change --force-device-scale-factor in .xinitrc"
echo "  (try 1.1 or 1.2 if text feels small)"
echo ""
echo "Reboot now: sudo reboot"
