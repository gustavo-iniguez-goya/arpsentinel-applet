#!/usr/bin/env python3
import dbus
import dbus.service
from gi.repository import GObject, GLib
from dbus.mainloop.glib import DBusGMainLoop

# qdbus --system org.arpsentinel /org/arpsentinel sendAlert orig_mac, orig_ip, x, device, alert_type, mac_vendor

class ArpSentinel(dbus.service.Object):
    def __init__(self):
        self.session_bus = dbus.SystemBus()
        name = dbus.service.BusName("org.arpsentinel", bus=self.session_bus)
        dbus.service.Object.__init__(self, name, '/org/arpsentinel')

    @dbus.service.signal('org.arpsentinel.alerts')
    def getAlert(self, orig_mac, orig_ip, x, device, alert_type, mac_vendor=''):
        print("%s,%s,%s,%s,%s,%s" % (orig_mac, orig_ip, x, device, alert_type, mac_vendor))
        return orig_mac

    @dbus.service.method("org.arpsentinel.alerts", in_signature='ssssss', out_signature='as')
    def sendAlert(self, orig_mac, orig_ip, x, device, alert_type, mac_vendor=''):
        self.getAlert(orig_mac, orig_ip, x, device, alert_type, mac_vendor)
        return ["Hello", "from arpsentinel-service.py", "with unique name", self.session_bus.get_unique_name()]

    @dbus.service.method("org.arpsentinel.alerts", in_signature='', out_signature='')
    def Exit(self):
        loop.quit()

if __name__ == '__main__':
    # using glib
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    object = ArpSentinel()
    loop = GLib.MainLoop()
    loop.run()
