# arpsentinel-applet
cinnamon applet for monitor events on the LAN, using arpalert.

#### WIP

* The MITM feature is just a PoC, experimental. A service like https://checkmyhttps.net/ would be more suitable.
In any case, this will only work for HTTPS.
* Detect network and devices changes, and enable/disable checks on demand, or clean the devices list.
* Check out DHCP, DNS and route config.

## Installation
- `apt-get install arpalert` || `dnf install arpalert` || `yum install arpalert`
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

## TODOs / Ideas (where someone (you!) could work on)
* Allow to filter/search devices list by ip/mac/vendor.
* Make the devices list scrollable.
* Allow to scan a device.
* Manually/Periodically scan the network on demand.
* Script to block malicious devices (manually and based on certain events).
* Create a GUI to do all the above.
* Fix devices list, and put the icon on the left.
* finish/complete gnome-shell extension.
* Translations.

----

## Need help?

Check out [the wiki](https://github.com/gustavo-iniguez-goya/arpsentinel-applet/wiki)

