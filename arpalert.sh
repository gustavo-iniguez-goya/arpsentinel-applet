#/bin/sh

DBUS_SESSION_ADDRESS="tcp:host=localhost,bind=*,port=55555,family=ipv4"
export DBUS_SESSION_ADDRESS="tcp:host=localhost,bind=*,port=55555,family=ipv4"
export DISPLAY=:0
hostname=$(hostname)
#logger $*

# Other methods
#gdbus call --system --dest org.arpsentinel --object-path /org/arpsentinel --method org.arpsentinel.alerts.sendAlert "$1" "$2" "$3" "$4" "$5" "$6"
#dbus-send --session --type=method_call --dest='org.gnome.Shell' '/com/michalrus/TextInTaskBar' com.michalrus.TextInTaskBar.setText string:"$1" string:"$2" string:"$3" string:"$4" string:"$5" string:"$6"
#dbus-send --system --type=method_call --dest='org.gnome.Shell' '/com/michalrus/TextInTaskBar' com.michalrus.TextInTaskBar.setText string:"$1" string:"$2" string:"$3" string:"$4" string:"$5" string:"$6"
#dbus-send --session --type=method_call --dest='org.gnome.Shell' '/org/arpsentinel' org.arpsentinel.Message.setText string:"1" string:"r" string:"n" string:"b" string:"v" string:"a"

DBUS_CMD="$(which qdbus)"

if [ "$DBUS_CMD" = "" ]
then
    gdbus call --system --dest org.arpsentinel --object-path /org/arpsentinel --method org.arpsentinel.alerts.sendAlert "$1" "$2" "$3" "$4" "$5" "$6"
else
    qdbus --system org.arpsentinel /org/arpsentinel sendAlert "$1" "$2" "$3" "$4" "$5" "$6"
fi
