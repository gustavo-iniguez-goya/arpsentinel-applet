# arpsentinel-applet
cinnamon applet for monitor events on the LAN

WIP

## Installation
- `apt-get install arpalert`
- `git clone ...`
- `cd arpsentinel-applet`
- `cp -a arpsentinel@arpsentinel.github.io/ ~/.local/share/cinnamon/applets/`
- `sudo cp arpalert.service /usr/share/dbus-1/system-services/org.arpsentinel.service`
- `sudo cp arpsentinel.conf /etc/dbus-1/system.d/`
- modify the following options of /etc/arpalert/arpalert.conf:
  - maclist file = "~/.local/share/cinnamon/applets/arpsentinel@arpsentinel.github.io/data/maclist.allow"
  - maclist alert file = "~/.local/share/cinnamon/applets/arpsentinel@arpsentinel.github.io/data/maclist.deny"
  - maclist leases file = "~/.local/share/cinnamon/applets/arpsentinel@arpsentinel.github.io/data/arpalert.leases"
  - action on detect = "~/.local/share/cinnamon/applets/arpsentinel@arpsentinel.github.io//bin/arpalert.sh"

- Add the applet to the panel: right click on the cinnamon panel -> Add applets to the panel -> ARP Sentinel

----

## Troubleshooting

* The applet always displays _0 devices_
  1. Check out if _arpalert_ is running (`ps ax|grep arpalert`). If not take a look at /var/log/arpalert.log
  2. Check out if the dbus service is running: `ps ax|grep arpalert-service`
  3. Send a message to the applet:
    - `qdbus --system org.arpsentinel /org/arpsentinel sendAlert "1" "2" "3" "4" "5" "6"`
----

## List of useful resources to start hacking cinnamon/gnome applets or extensions
### Documentation
- http://developer.linuxmint.com/reference/git/cinnamon-tutorials/write-applet.html
- https://people.gnome.org/~gcampagna/docs/GLib-2.0/index.html
- https://people.gnome.org/~gcampagna/docs/Gio-2.0/index.html
- http://developer.linuxmint.com/reference/git/cinnamon-tutorials/xlet-settings.html
- https://wiki.gnome.org/Gjs/Examples/DBusClient

### Read other's applets source code
- https://github.com/collinss/cinnamon-places-center 
- https://github.com/linuxmint/cinnamon-spices-applets/blob/master/stocks%40adonut/files/stocks%40adonut/applet.js

### search for functions and learn how to use them
- https://javascriptexamples.info/
- https://www.bvbcode.com/
