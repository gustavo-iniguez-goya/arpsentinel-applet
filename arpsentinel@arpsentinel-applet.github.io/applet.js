/**
    ARP Sentinel applet for cinnamon panel
    Copyright (C) 2017 Gustavo Iñiguez Goia

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
 */

/**
 * This is how the applet works:
 *
 * 1. arpalert detects network events, and calls the script 
 *  (/etc/arpalert/arpalert.conf:action on detect = "/path/to.sh")
 * 2. The script dispatches a dbus event through our service arpdefender-service.py, 
 *  using sendAlert method with 6 parametes
 * 3. The applet listens dbus events for our interface, and obtains the alerts 
 *  via the getAlert method
 * 4. Once we get an event, we alert the user is we need to.
 */

const AppletUUID = 'arpsentinel@arpsentinel-applet.github.io';

const Applet = imports.ui.applet;
const Util = imports.misc.util;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Signals = imports.signals;
const Tray = imports.ui.messageTray;
const NetworkManager = imports.gi.NetworkManager;

/* local imports */
const AppletDir = imports.ui.appletManager.appletMeta[AppletUUID].path;
const AppletObj = imports.ui.appletManager.applets[AppletUUID];
imports.searchPath.unshift(AppletDir);
const Constants = imports.constants;
// it seems that imports.actions does not call the functions in there. This way it does.
const Actions = AppletObj.actions;
const Spawn = AppletObj.spawn;
const ArpSentinelObj = AppletObj.arpsentinel;
const NotificationsManager = AppletObj.notifications;
const SubMenuMenuItem = AppletObj.submenumenuitem;

/**
 * TODOS:
 * - translate it
 * - filter devices by mac, ip, vendor
 * - options to choose what alerts to display:
 *  list of alerts to select: [x] MAC CHANGE, [x] UNKNOWN
 *
 * sysctl net.ipv4.conf.$INTERFACE.arp_ignore=8 > /dev/null
 * sysctl net.ipv4.conf.$INTERFACE.arp_announce=2 > /dev/null
 *  ip6tables -I INPUT 2 -i $INTERFACE --protocol icmpv6 --icmpv6-type neighbor-solicit -j DROP
 *  ip6tables -I INPUT 1 -i $INTERFACE --protocol icmpv6 --icmpv6-type echo-request -j DROP
 *
 */

const ARPSentinelIface = '<node> \
<interface name="org.arpsentinel.alerts"> \
<method name="sendAlert"> \
    <arg type="s" name="mac_orig"/> \
    <arg type="s" name="ip_orig"/> \
    <arg type="s" name="x"/> \
    <arg type="s" name="device"/> \
    <arg type="s" name="alert_type"/> \
    <arg type="s" name="mac_vendor"/> \
</method> \
<signal name="getAlert"> \
    <arg type="s" name="mac_orig"/> \
    <arg type="s" name="ip_orig"/> \
    <arg type="s" name="x"/> \
    <arg type="s" name="device"/> \
    <arg type="s" name="alert_type"/> \
    <arg type="s" name="mac_vendor"/> \
</signal> \
</interface> \
</node>';

/**
 * This is the entry point for the alerts.
 *
 */

const ARPSentinelProxy = Gio.DBusProxy.makeProxyWrapper(ARPSentinelIface);
const ArpSentinelService = new Lang.Class({
    Name: 'ArpSentinelService',

    _init: function(_arpSentinel) {
        //global.log('ArpSentinelService.init()')
        this.arpSentinel = _arpSentinel;

        this.ADProxy = new ARPSentinelProxy(
                    Gio.DBus.system,
                    "org.arpsentinel",
                    "/org/arpsentinel"
                );
// We can send an event back to the service.
//        ADProxy.sendAlertSync("x", "xx", "", "xxx", "xxxxx", "xxxxxxxx");

        // getAlert is defined in the service arpdefender-service.py
        this._signalId = this.ADProxy.connectSignal(Constants.SIGNAL_EVENTS_METHOD, 
            Lang.bind(this, function(proxy, senderName, 
                [mac_orig, ip_orig, x, device, alert_type, mac_vendor]) {
                //global.log('New alert. mac: ' + mac_orig + ' ip: ' + ip_orig + ' device: ' + device + ' type: ' + alert_type + ' vendor: ' + mac_vendor);
                    let data = {
                        mac: mac_orig, 
                        ip: ip_orig, 
                        str: x, 
                        device: device, 
                        type: alert_type, 
                        vendor: mac_vendor
                    };
                let pos_dev = -1;
                let pos_alert = -1;
                pos_dev = this.arpSentinel.get_device_index(data);
                if (pos_dev === -1){
                    this.arpSentinel.buildAlert(data, pos_alert, pos_dev, -1,
                        function (_text, data, _icon){
                            arpSentinelApplet.add_alert(_text, data, _icon);
                            arpSentinelApplet.add_device(data);
                        });
                    return;
                }
                let dupe_dev = this.arpSentinel.check_ip_conflict(data);
                if (dupe_dev !== -1){
                    data.type = Constants.ALERT_IP_DUPLICATED;
                }
                pos_alert = this.arpSentinel.get_alert_index(data);
                if (pos_alert === -1){
                    // XXX: by the first time we build an alert, the device already exist in the list, because we have added it above
                    this.arpSentinel.buildAlert(data, pos_alert, pos_dev, dupe_dev,
                        function (_text, data, _icon){
                            arpSentinelApplet.add_alert(_text, data, _icon);
                        });
                }
                data = undefined;
        }));

    },

    destroy: function(){
        //global.log('ARP Sentinel Service destroyed');
        this.ADProxy.disconnect(this.ADProxy._signalId);
        Signals._disconnectAll.apply(this.ADProxy);
        this.ADProxy = null;
    }
});

function ARPSentinelApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

ARPSentinelApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,


    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.display_id = 0;
        this.instance_id = instance_id;
        this.orientation = orientation;
        this.alert_id = null;
        
        this.arpSentinel = new ArpSentinelObj.ArpSentinel();
        this.ARPSentinelService = new ArpSentinelService(this.arpSentinel);

        this.settings = new Settings.AppletSettings(this, metadata.uuid, instance_id);
        this.pref_max_devices = null;
        this.pref_max_items_in_list = 20;
        this.pref_hardening_mode = true;
        this.pref_block_command = null;
        this.pref_alert_ip_change = null;
        this.pref_alert_mac_not_wl = null;
        this.pref_alert_mac_bl = null;
        this.pref_check_https = false;
        this.pref_https_interval = 10;
        this.pref_https_domains = null;
        this._https_interval_timeout_id = null;
        this.pref_whitelisted_devices = Actions.macs_in_whitelist;
        this.settings.setValue(Constants.PREF_WHITELISTED_DEVS, this.pref_whitelisted_devices);
        this.pref_alert_whitelisted = false;
        // TODO: reset macs/alerts on net wakeup
        // this.pref_reset_on_wakeup = true;

        this._bind_settings();
        this._start_monitoring_https();

        this.clipboard = St.Clipboard.get_default();
        this.menuManager = new PopupMenu.PopupMenuManager(this);

        this.set_applet_icon_name("security-high");
        this.update_devices_list();

        this.menu = new Applet.AppletPopupMenu(this, this.orientation, this.instance_id);
        this.menuManager.addMenu(this.menu);
        // TODO: make the devices list scrollable
        //this.vscroll = new St.ScrollView({ style_class: 'popup-sub-menu',
        //                                 hscrollbar_policy: Gtk.PolicyType.NEVER,
        //                                 vscrollbar_policy: Gtk.PolicyType.AUTOMATIC });
        //this.scrollbox = new St.BoxLayout({vertical: true });
        //this.vscroll.add_actor(this.scrollbox);
        //this.menu.addActor(this.vscroll);

        this._add_sticky_menus();
    
        this.notifications = new NotificationsManager.Notifications();

        this.arpSentinel.on_connectivity_change(
            function(_state){
                switch(_state){
                    case NetworkManager.ConnectivityState.UNKNOWN:
                    case NetworkManager.ConnectivityState.NONE:
                    case NetworkManager.ConnectivityState.PORTAL:
                    case NetworkManager.ConnectivityState.LIMITED:
                        this._remove_https_monitor();
                        break;
                    case NetworkManager.ConnectivityState.FULL:
                        this.arpSentinel.reset_lists();
                        this._start_monitoring_https();
                        break;
                    default:
                        break;
                }
            });
    },

    _bind_settings: function(){
        let emptyCallback = function() {}; // for cinnamon 1.8

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_MAX_DEVICES,
            "pref_max_devices",
            emptyCallback);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_MAX_ITEMS_IN_LIST,
            "pref_max_items_in_list",
            emptyCallback);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_HARDENING_MODE,
            "pref_hardening_mode",
            Lang.bind(this, function(state){
                this.pref_hardening_mode = state;
                this.menuPrefs.setToggleState(state);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.BIDRECTIONAL,
            Constants.PREF_CHECK_HTTPS,
            "pref_check_https",
            Lang.bind(this, function(state){
                this.pref_check_https = state;
                this.menuHttps.setToggleState(state);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_HTTPS_INTERVAL,
            "pref_https_interval",
            Lang.bind(this, function(interval){
                if (this.pref_check_https === false || interval === '' ||
                        interval === undefined || interval < 10 ||
                        interval === this.pref_https_interval){
                    return;
                }
                this.pref_https_interval = interval;
                //global.log('HTTPS INTERVAL: ' + interval);
                if (this.pref_check_https === true){
                    this._remove_https_monitor();
                    this._start_monitoring_https();
                    //global.log('HTTPS INTERVAL UPDATED');
                }
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_HTTPS_DOMAINS,
            "pref_https_domains",
            Lang.bind(this, function(_text){
                //global.log('DOMAINSSS: ' + _text);
                this.pref_https_domains = _text;
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_BLOCK_COMMAND,
            "pref_block_command",
            emptyCallback);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_MAC_BL,
            "pref_alert_bl",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_MAC_BL);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_MAC_NOT_WL,
            "pref_alert_mac_not_wl",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_MAC_NOT_WL);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_IP_CHANGE,
            "pref_alert_ip_change",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_IP_CHANGE);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_GLOBAL_FLOOD,
            "pref_alert_global_flood",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_GLOBAL_FLOOD);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_TOO_MUCH_ARP,
            "pref_alert_too_much_arp",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_TOO_MUCH_ARP);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_ETHER_NOT_ARP,
            "pref_alert_ether_not_arp",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_ETHER_NOT_ARP);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_ALERT_MAC_NEw,
            "pref_alert_mac_new",
            Lang.bind(this, function(state){
                this.arpSentinel.handle_show_alerts(state, Constants.ALERT_MAC_NEW);
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.BIDIRECTIONAL,
            Constants.PREF_ALERT_WHITELISTED,
            "pref_alert_whitelisted",
            Lang.bind(this, function(state){
                this.pref_alert_whitelisted = state;
            }));

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            Constants.PREF_WHITELISTED_DEVS,
            "pref_whitelisted_devices",
            Lang.bind(this, function(_text){
                this.pref_whitelisted_devices = _text;
                Actions.save_whitelist(_text);
            }));
    },

    on_applet_clicked: function(event) {
        this.menu.toggle();
        this.set_applet_icon_name( Constants.ICON_SECURITY_LOW );
        this.update_devices_list();
        this.arpSentinel.set_alert_level(Constants.ALERT_NONE);
    },

    on_applet_removed_from_panel: function(conf){
        this.destroy();
    },

    update_devices_list: function(){
        this.set_text(this.arpSentinel.get_devices_num() + ' devices');
        this.set_applet_tooltip(
            this.arpSentinel.get_devices_num() + ' unique devices seen so far\n'
            + this.arpSentinel.alerts.length + ' alerts'
        );
    },

    _clear_list: function(){
        this.menu.removeAll();
        this._add_sticky_menus();
    },

    set_icon: function(_icon){
        this.set_applet_icon_name( _icon );
    },

    set_text: function(_text){
        this.set_applet_label( _text );
    },

    /**
     * Persistent menu entries
     *
     */
    _add_sticky_menus: function(){
        this.menuHttps = new PopupMenu.PopupSwitchIconMenuItem("Monitor if you're being spied", false, "changes-prevent", St.IconType.FULLCOLOR);
        this.menuHttps.connect('toggled', Lang.bind(this, function(_item, state) {
            this.pref_check_https = state;
            //global.log('DOMAINS: ' + this.pref_https_domains);
            if (state === true){
                _item.setIconName('changes-prevent');
                this._start_monitoring_https();
            }
            else{
                this._remove_https_monitor();
                _item.setIconName('changes-allow');
            }
        }));
        this.menuHttps.setToggleState(this.pref_check_https);
        this.menu.addMenuItem(this.menuHttps, 0);

        this.menuPrefs = new PopupMenu.PopupSwitchMenuItem("Auto blacklist non whitelisted MACs", true);
        this.menuPrefs.connect('toggled', Lang.bind(this, function(_item, state) {
            this.pref_hardening_mode = state;
        }));
        this.menuPrefs.setToggleState(this.pref_hardening_mode);
        this.menu.addMenuItem(this.menuPrefs, 1);

        let itReset = new PopupMenu.PopupIconMenuItem("Reset", 'view-refresh', St.IconType.SYMBOLIC);
        itReset.connect('activate', Lang.bind(this, function(_item, event) {
            this.menu.removeAll();
            this._add_sticky_menus();
            this.arpSentinel.reset_lists();
            this.set_text("0 devices");
        }));
        this.menu.addMenuItem(itReset, 2);

        let itClear = new PopupMenu.PopupIconMenuItem("Clear alerts list", 'edit-clear-all', St.IconType.SYMBOLIC);
        itClear.connect('activate', Lang.bind(this, function(_item, event) {
            this._clear_list();
        }));
        this.menu.addMenuItem(itClear, 3);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), 4);
    },

    /**
     * Adds the whitelist menu to every entry in the list
     */
    add_whitelist_button: function(item, data){
        if (data.type == Constants.ALERT_MAC_NOT_WL || data.type == Constants.ALERT_MAC_BL){
            let itemNotWL = new PopupMenu.PopupMenuItem( "  Add to whitelist >" );
            itemNotWL['arpsentinel'] = data;
            itemNotWL.connect('activate', Lang.bind(this, function(_item, ev){
                this.pref_whitelisted_devices = Actions.add_whitelist_mac(_item.arpsentinel, true);
                itemNotWL.destroy();
            }));
            item.menu.addMenuItem(itemNotWL);
        }
    },
    
    /**
     * Adds the blacklist menu to every entry in the list
     */
    add_blacklist_button: function(item, data){
        let label_text = "  Add to blacklist >";
        // if the MAC is already blacklisted, allow to delete it.
        if (data.type == Constants.ALERT_MAC_BL){
            label_text = "  Remove from blacklist >";
        }
        let itemBL = new PopupMenu.PopupMenuItem( label_text );
        itemBL['arpsentinel'] = data;

        itemBL.connect('activate', Lang.bind(this, function(_item, ev){
            if (data.type == Constants.ALERT_MAC_BL){
                Actions.remove_blacklist_mac(_item.arpsentinel);
            }
            else{
                Actions.add_blacklist_mac(_item.arpsentinel, true);
            }
        }));
        item.menu.addMenuItem(itemBL);
    },

    /**
     * Adds a new entry to the list of received alerts
     */
    add_alert: function(_text, data, _icon){
        //if (this.arpSentinel.is_alert_id_enabled(data.type) === false){
        //        global.log('Alert not in list: ' + data.type);
        //        return;
        //}
        this.arpSentinel.set_alert_level(data.type);
        this.set_applet_icon_name(_icon);
        
        let dateFormat = _("%Y/%m/%d %H:%M:%S");
        let displayDate = new Date();

        let alert_details = '  Date: \t' + displayDate.toLocaleFormat(dateFormat) + 
                '\n  MAC: \t' + data.mac + 
                '\n  IP: \t\t' + data.ip + 
                '\n  DEVICE: \t' + data.device + 
                '\n  VENDOR: \t' + data.vendor;
        if (this.arpSentinel.get_alert_level() === Constants.ALERT_ETHER_NOT_ARP &&
            this.arpSentinel.is_alert_id_enabled(Constants.ALERT_ETHER_NOT_ARP) === true){
            this.notifications.show('WARNING!! Possible ARP spoofing in course',
                'There might be an ARP spoofing in course. Details:\n\n' + alert_details, _icon,
                Tray.Urgency.CRITICAL,
                this.notifications.TYPE_ARP_SPOOFING
            );
            Mainloop.timeout_add(600, Lang.bind(this, this._blink_alert), 1);
        }
        else if (this.arpSentinel.get_alert_level() === Constants.ALERT_GLOBAL_FLOOD &&
            this.arpSentinel.is_alert_id_enabled(Constants.ALERT_GLOBAL_FLOOD) === true){
            this.notifications.show('WARNING! Global flood detected',
                'There might be an ARP scan in course, or something worst. Details:\n\n' + alert_details, _icon,
                Tray.Urgency.CRITICAL,
                this.notifications.TYPE_GLOBAL_FLOOD
            );
            Mainloop.timeout_add(800, Lang.bind(this, this._blink_alert), 1);
        }
        else if (this.arpSentinel.get_alert_level() === Constants.ALERT_TOO_MUCH_ARP &&
            this.arpSentinel.is_alert_id_enabled(Constants.ALERT_TOO_MUCH_ARP) === true){
            this.notifications.show('WARNING!',
                '<b>This device is sending too much ARPs</b>\n\nDetails:\n' + alert_details, _icon,
                Tray.Urgency.CRITICAL,
                this.notifications.TYPE_GLOBAL_FLOOD
            );
            Mainloop.timeout_add(800, Lang.bind(this, this._blink_alert), 1);
        }
        else if (this.arpSentinel.get_alert_level() === Constants.ALERT_IP_DUPLICATED &&
            this.arpSentinel.is_alert_id_enabled(Constants.ALERT_IP_DUPLICATED) === true){
            this.notifications.show('WARNING! ',
                '<b>' + _text + '</b>'
                + '\n(This also may indicate that an ARP spoofing in course)'
                + '\n\nDetails:\n\n' + alert_details, _icon,
                Tray.Urgency.CRITICAL,
                this.notifications.TYPE_IP_DUPLICATED
            );
            Mainloop.timeout_add(1000, Lang.bind(this, this._blink_alert), 1);
        }
        else if (this.arpSentinel.get_alert_level() === Constants.ALERT_MAC_CHANGE &&
            this.arpSentinel.is_alert_id_enabled(Constants.ALERT_MAC_CHANGE) === true){
            this.notifications.show('WARNING! ',
                '<b>' + _text + '</b>'
                + '\n\nDetails:\n\n' + alert_details, _icon,
                Tray.Urgency.CRITICAL,
                this.notifications.TYPE_MAC_CHANGE
            );
            Mainloop.timeout_add(1000, Lang.bind(this, this._blink_alert), 1);
        }

        let ic = new St.Icon({ icon_name: _icon,
                 icon_type: St.IconType.FULLCOLOR,
                 icon_size: 24 });
        let itAlert = new PopupMenu.PopupSubMenuMenuItem(_text);
        itAlert.addActor(ic, { span: 0 });
        //let itAlert = new SubMenuMenuItem.SubMenuMenuItem(_icon, _text);
        let subItem = new PopupMenu.PopupMenuItem(alert_details);
        subItem.connect('activate', Lang.bind(this, function(_item, ev){
            this.clipboard.set_text(_item.label.text);
        }));
        this.menu.addMenuItem(itAlert, 5);
        //this.scrollbox.add(itAlert.actor);
        
        itAlert.menu.addMenuItem(subItem);
        itAlert.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.add_whitelist_button(itAlert, data);
        this.add_blacklist_button(itAlert, data);
        // TODO: add net-tools -> scan host, nuke host, block host, etc...

        if (this.pref_hardening_mode === true){
            //global.log('add_alert, auto blacklisting mac: ' + data.mac);
            Actions.add_blacklist_mac(data, false);
        }
        data['title'] = _text;
        data['timestamp'] = displayDate.getTime();
        this.arpSentinel.add_alert(data);
    },

    _blink_alert: function(state){
        if (this.arpSentinel.get_alert_level() !== Constants.ALERT_GLOBAL_FLOOD){
            this.actor.style_class = '';
            return false;
        }
        if (this.actor.style_class === 'blinking-alert-on'){
            this.actor.style_class = 'blinking-alert-off';
            return true;
        }
        else{
            this.actor.style_class = 'blinking-alert-on';
        //    app.set_applet_label('alert on');
        }

        return true;
    },

    /**
     * Start monitoring https SSL certs every n seconds.
     */
    _start_monitoring_https: function(){
        //global.log('_start_https_monitor()');
        if (this.pref_check_https === true && this.arpSentinel && this.arpSentinel.get_connectivity() === NetworkManager.ConnectivityState.FULL){
            this._https_interval_timeout_id = Mainloop.timeout_add_seconds(this.pref_https_interval, Lang.bind(this, this._check_https_integrity));
        }
    },

    _remove_https_monitor: function(){
        //global.log('_remove_https_monitor()');
        Mainloop.source_remove(this._https_interval_timeout_id);
        this._https_interval_timeout_id = null;
    },

    _check_https_integrity: function(app){
        //global.log('check_https_integrity()');
        if (this.pref_check_https === true){
            let checker = new Spawn.SpawnReader();
            let ds = this.pref_https_domains.split('\n');
            for (i=0, len=ds.length; i < len; i++){
                if (this.pref_check_https === false || this.arpSentinel.get_connectivity() !== NetworkManager.ConnectivityState.FULL){
                    break;
                }
                if (ds[i][0] === '#'){
                    global.log('EXCLUDING DOMAIN: ' + ds[i]);
                    continue;
                }

                let d = ds[i].split(' ');
                if (d.length === 1){
                    global.log('BAD DOMAIN: ' + ds[i]);
                    continue;
                }
                //let openssl_cmd = ['openssl s_client -showcerts -connect ' + d[0] + ':443 -servername ' + d[0] + ' </dev/null | openssl x509 -fingerprint -noout'];
                let openssl_cmd = [ AppletDir + '/bin/check_https.sh', d[0] ];
                checker.spawn('./', openssl_cmd, GLib.SpawnFlags.SEARCH_PATH, (line) => {
                    // XXX: == is typed intentionally
                    if (line == d[1]){
                        //global.log('HTTP OK: ' + d[1]);
                    }
                    else{
                        //global.log('HTTP K.O.: ' + line);
                        this.set_icon(Constants.ICON_DIALOG_WARNING);
                        // XXX: Note, Notification() does not allow break lines in the title. @see /usr/share/cinnamon/js/ui/messageTray.js:573
                        this.notifications.show('WARNING!',
                            '<b>Your communications might be being intercepted</b>\n\n'
                            + d[0] + ' fingerprint obtained:\n ' + line
                            + '\n' + d[0] + ' fingerprint saved:\n ' + d[1]
                            + '\n\nCheck it out, and reenable the check again.', Constants.ICON_DIALOG_WARNING,
                            Tray.Urgency.CRITICAL,
                            this.notifications.TYPE_MITM
                        );
                        Mainloop.timeout_add(600, Lang.bind(this, this._blink_alert), 1);
                        this.pref_check_https = false;
                    }
                });
            }

            let arp_cmd = [ AppletDir + '/bin/monitor_arp.sh' ];
            checker.spawn('./', arp_cmd, GLib.SpawnFlags.SEARCH_PATH, (line) => {
                let arp_entry = line.toString().split(' ');
                this._check_trusted_devices(
                    {mac: arp_entry[0], ip: arp_entry[1]},
                    'Your ARP cache table is poisoned:');
            });

            return true;
        }
        else{
            //global.log('check_https_integrity() false, stopping');
            return false;
        }
    },

    /**
     * display an alert, if one of the defined trusted device tuple
     * has changed.
     *
     */
    _check_trusted_devices: function(dev, title){
        if (this.pref_alert_whitelisted === true && this.pref_whitelisted_devices !== ''){
            let trusted_dev = Actions.is_whitelisted(dev);
            if (trusted_dev !== false){
                this.notifications.show('WARNING! ' + title,
                    "Saved IP-MAC:\n  " + trusted_dev
                    + "\n\nDetected change:"
                    + "\n  MAC: " + dev.mac
                    + "\n  IP: " + dev.ip
                    + "\n\nReview it, check your ARP cache, do an arping, etc.",
                    Constants.ICON_DIALOG_WARNING,
                    Tray.Urgency.CRITICAL,
                    this.notifications.TYPE_TRUSTED_CHANGE
                );
            }
        }
    },


    /**
     * Adds a new device to the list
     */
    add_device: function(dev){
        if (this.pref_max_items_in_list !== 0 && this.menu._getMenuItems().length > this.pref_max_items_in_list){
            this._clear_list();
        }
        if (this.pref_max_devices > 0 && this.arpSentinel.get_devices_num() > 0 &&
                (this.arpSentinel.get_devices_num()+1) > this.pref_max_devices){
            this.notifications.show('WARNING! Too many devices detected on the LAN',
                'Max devices configured: ' + this.pref_max_devices
                + '\nDevice detected:'
                + '\n\tMAC: ' + dev.mac
                + '\n\tIP: ' + dev.ip
                + '\n\tDEVICE: ' + dev.device
                + '\n\tVENDOR: ' + dev.vendor
                + '\n\nLaunch wireshark and see what\'s going on.', Constants.ICON_DIALOG_WARNING,
                Tray.Urgency.CRITICAL,
                this.notifications.TYPE_MAX_DEVICES
            );
        }
        this._check_trusted_devices(dev, 'One of your trusted devices has changed:');
        this.arpSentinel.add_device(dev);
        this.update_devices_list();
    },

    destroy: function(){
        //global.log('ARP Sentinel applet destroyed');
        this._remove_https_monitor();
        this.arpSentinel.destroy();
        this.ARPSentinelService.destroy();
        this.ARPSentinelService = undefined;
        this.arpSentinel = undefined;
        arpSentinelApplet = undefined;
    }

};

var arpSentinelApplet = null;
function main(metadata, orientation, panel_height, instance_id) {
    //global.log('ARPSentinel ready');
    arpSentinelApplet = new ARPSentinelApplet(metadata, orientation, panel_height, instance_id);
    return arpSentinelApplet;
}

function enable(){
    //global.log('ARP Sentinel enabled');
}

function disable(){
    //global.log('ARP Sentinel disabled');
}
