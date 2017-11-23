#!/bin/sh
APP_HOME="arpsentinel-applet"
APP_UUID="arpsentinel@arpsentinel.github.io"
CINNAMON_APPLETS="$HOME/.local/share/cinnamon/applets/"
DBUS_SERVICE="[D-BUS Service]\nName=org.arpsentinel\nExec=$HOME/.local/share/cinnamon/applets/$APP_UUID/bin/arpalert-service.py\nUser=arpalert"

error(){
  echo " KO"
  exit
}

mkdir -p $CINNAMON_APPLETS 2>/dev/null
out=$(/bin/cp -a $APP_UUID/ $CINNAMON_APPLETS)
[ "$?" = "0" ] && echo " OK" || error

echo -n "[+] Enable ARPSentinel system service: "
echo -e $DBUS_SERVICE
out=$(/bin/echo -e $DBUS_SERVICE > arpsentinel.service.temp; sudo /bin/cp arpsentinel.service.temp /usr/share/dbus-1/system-services/org.arpsentinel.service)
[ "$?" = "0" ] && echo " OK" || error
out=$(sudo /bin/cp ./arpsentinel.conf /etc/dbus-1/system.d/)
[ "$?" = "0" ] && echo " OK" || error

echo "[+] Now modify the following options of /etc/arpalert/arpalert.conf:"
echo "    maclist file = "$HOME/$APP_HOME/maclist.allow""
echo "    maclist alert file = "$HOME/$APP_HOME/maclist.deny""
echo "    maclist leases file = "$HOME/$APP_HOME/arpalert.leases""

sleep 2
# check if /etc/sudoers.d/ exists
# if [ -d '/etc/sudoers.d' ] ...
echo "[+] And add this line to /etc/sudoers to effectively block offenders:"
echo "    user host = (root) NOPASSWD: $HOME/$APP_HOME/block_mac.sh"

sleep 2

echo "DONE"
