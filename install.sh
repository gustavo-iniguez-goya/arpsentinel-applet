#!/bin/sh
APP_HOME="arpsentinel-applet"
APP_UUID="arpsentinel@$APP_HOME.github.io"
CINNAMON_APPLETS="$HOME/.local/share/cinnamon/applets/"
DBUS_SERVICE="[D-BUS Service]\nName=org.arpsentinel\nExec=$HOME/.$APP_HOME/bin/arpalert-service.py\nUser=arpalert"

error(){
  [ -z "$1" ] && echo " KO" || echo "\n[-] ERROR: $1"
  exit
}

mkdir -p ~/.$APP_HOME/bin/ 2>/dev/null
touch ~/.$APP_HOME/maclist.allow ~/.$APP_HOME/maclist.deny ~/.$APP_HOME/maclist.trusted
cp ./arpalert-service.py ~/.$APP_HOME/bin/ ./arpalert.sh ~/.$APP_HOME/bin/

#chown arpalert ~/.$APP_HOME/maclist.allow ~/.$APP_HOME/maclist.deny
#[ "$?" != "0" ] || error "You must install arpalert: sudo apt-get install arpalert, sudo dnf install arpalert, etc"

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
echo "    maclist file = "$HOME/.$APP_HOME/maclist.allow""
echo "    maclist alert file = "$HOME/.$APP_HOME/maclist.deny""
echo "    action on detect = "$HOME/.$APP_HOME/bin/arpalert.sh""
#echo "    maclist leases file = "$HOME/$APP_HOME/arpalert.leases""

sleep 2
# check if /etc/sudoers.d/ exists
# if [ -d '/etc/sudoers.d' ] ...
echo "[+] And add this line to /etc/sudoers to effectively block offenders:"
echo "    user host = (root) NOPASSWD: $HOME/.$APP_HOME/block_mac.sh"

sleep 2

echo "DONE"
