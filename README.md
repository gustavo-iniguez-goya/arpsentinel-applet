# arpsentinel-applet
cinnamon applet for monitor events on the LAN

#### WIP

* gnome-shell code not added to the repo yet, and it lacks some features.
* The MITM feature is just a PoC, experimental. The SSL certs of those domains tend to change a lot, so it would be better to check a domain which doesn't change. Or a service like https://checkmyhttps.net/

## Installation
- `apt-get install arpalert`
- `git clone ...`
- `cd arpsentinel-applet`
- `cp -a arpsentinel@arpsentinel-applet.github.io/ ~/.local/share/cinnamon/applets/`
- `mkdir -p ~/.arpsentinel-applet/bin/`
- `touch ~/.arpsentinel-applet/maclist.allow ~/.arpsentinel-applet/maclist.deny`
- `cp arpalert-service.py arpalert.sh ~/.arpsentinel-applet/bin/`
- `sudo cp arpalert.service /usr/share/dbus-1/system-services/org.arpsentinel.service` (modify the user's home path in Exec=)
- `sudo cp arpsentinel.conf /etc/dbus-1/system.d/`
- modify the following options of /etc/arpalert/arpalert.conf:
  - maclist file = "~/.arpsentinel-applet/maclist.allow"
  - maclist alert file = "~/.arpsentinel-applet/maclist.deny"
  - maclist leases file = "~/.arpsentinel-applet/arpalert.leases"
  - action on detect = "~/.arpsentinel-applet/bin/arpalert.sh"

- Add the applet to the panel: right click on the cinnamon panel -> Add applets to the panel -> ARP Sentinel

----
## Screenshots
![Alerts list](https://raw.githubusercontent.com/gustavo-iniguez-goya/arpsentinel-applet/master/screenshots/screenshot1.png)
![Alert details](https://raw.githubusercontent.com/gustavo-iniguez-goya/arpsentinel-applet/master/screenshots/screenshot2.png)
![Alert details](https://raw.githubusercontent.com/gustavo-iniguez-goya/arpsentinel-applet/master/screenshots/screenshot3.png)

----

## TODOs / Ideas
* Allow to filter devices list by ip/mac/vendor.
* Make the devices list scrollable.
* Script to block malicious devices (manually and based on certain events).
* Translations.

----

## Troubleshooting

* The applet always displays _0 devices_
  1. Check out if _arpalert_ is running (`ps ax|grep arpalert`). If not take a look at /var/log/arpalert.log
  2. Check out if the dbus service is running: `ps ax|grep arpalert-service`
  3. Send a message to the applet:
    - `qdbus --system org.arpsentinel /org/arpsentinel sendAlert "1" "2" "3" "4" "5" "6"`

* The applet fails to load
  - Check out that the DBUS Service is running (`ps ax|grep arpalert-service`).
  - If it's not, launch it manually (`~/.arpsentinel-applet/bin/arpalert-service.py`) and add the applet afterwards.

* Gathering logs when reporting an issue:
  - Press _ALT+F2_ and type _lg_
  - Press Windows key + l, and select the extension tab.
  - `tail -f ~/.cinnamon/glass.log`
----

## List of useful resources to start hacking cinnamon/gnome applets or extensions
### Documentation
- https://mathematicalcoffee.blogspot.com.es/2012/09/gnome-shell-extensions-getting-started.html
- http://mathematicalcoffee.blogspot.it/2012/09/gnome-shell-javascript-source.html
- https://www.abidibo.net/blog/2016/03/02/how-i-developed-my-first-gnome-shell-extension/
- https://blog.fpmurphy.com/2011/04/gnome-3-shell-extensions.html
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
