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
![Alert details](https://raw.githubusercontent.com/gustavo-iniguez-goya/arpsentinel-applet/master/screenshots/screenshot4.png)
![Alert details](https://raw.githubusercontent.com/gustavo-iniguez-goya/arpsentinel-applet/master/screenshots/screenshot5.png)
![Alert details](https://raw.githubusercontent.com/gustavo-iniguez-goya/arpsentinel-applet/master/screenshots/screenshot6.png)

----

## TODOs / Ideas
* Allow to filter devices list by ip/mac/vendor.
* Make the devices list scrollable.
* Script to block malicious devices (manually and based on certain events).
* Translations.

----

## Need help?

Check out [the wiki](https://github.com/gustavo-iniguez-goya/arpsentinel-applet/wiki)

