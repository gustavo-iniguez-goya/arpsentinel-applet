#!/bin/sh
APP_HOME="arpsentinel-applet"
APP_UUID="arpsentinel@arpsentinel.github.io"
DBUS_SERVICE=$(
cat<<EOF
[D-BUS Service]\n
Name=org.arpsentinel\n
Exec="$HOME/.local/share/cinnamon/applets/arpsentinel@arpsentinel-applet.github.io/bin/arpalert-service.py"\n
User=arpalert
EOF
)

echo -n "[+] installing extension: "
out=$(sudo /bin/cp -a $APP_UID/ "~/./local/share/cinnamon/applets/")
[ "$out" = "0" ] && echo " OK" || echo " KO";exit

echo -n "[+] Enable ARPSentinel system service: "
out=$(sudo /bin/echo $DBUS_SERVICE > /usr/share/dbus-1/system-services/org.arpsentinel.service)
[ "$out" = "0" ] && echo " OK" || echo " KO";exit
out=$(sudo /bin/cp ./arpsentinel.conf /etc/dbus-1/system.d/)
[ "$out" = "0" ] && echo " OK" || echo " KO";exit

echo "[+] Now modify the following options of /etc/arpalert/arpalert.conf:"
echo "    maclist file = "$HOME/$APP_HOME/maclist.allow""
echo "    maclist alert file = "$HOME/$APP_HOME/maclist.deny""
echo "    maclist leases file = "$HOME/$APP_HOME/arpalert.leases""

sleep 1
# check if /etc/sudoers.d/ exists
# if [ -d '/etc/sudoers.d' ] ...
echo "[+] Add this line to /etc/sudoers to effectively block offenders:"
echo "    user host = (root) NOPASSWD: $HOME/$APP_HOME/block_mac.sh"

sleep 1

echo "DONE"
