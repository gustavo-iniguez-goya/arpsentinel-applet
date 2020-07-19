/**
    ARP Sentinel applet for cinnamon panel
    Copyright (C) 2017-2020 Gustavo Iñiguez Goia

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

var GLib = imports.gi.GLib;

var AppletUUID = 'arpsentinel@arpsentinel-applet.github.io';
var AppletName = 'arpsentinel-applet';

var SIGNAL_EVENTS_METHOD      =   'getAlert';

var POLICY_IGNORE_IPCHANGE    =   'ip_change';
var POLICY_IGNORE_BLISTED     =   'black_listed';
var POLICY_IGNORE_UNAUTH      =   'unauth_rq';
var POLICY_IGNORE_ABUSE       =   'rq_abus';
var POLICY_IGNORE_MAC_ERROR   =   'mac_error';
var POLICY_IGNORE_MAC_CHANGE  =   'mac_change';

var PREF_HARDENING_MODE   = 'hardening_mode';
var PREF_MAX_DEVICES      = 'max_devices';
var PREF_MAX_ITEMS_IN_LIST = 'max_items_in_list';
var PREF_CHECK_HTTPS      = 'check_https';
var PREF_HTTPS_INTERVAL   = 'https_interval';
var PREF_HTTPS_DOMAINS    = 'https_domains';
var PREF_BLOCK_COMMAND    = 'block_command';
var PREF_ALERT_IP_CHANGE  = 'alert_ip_change';
var PREF_ALERT_MAC_NOT_WL = 'alert_mac_not_wl';
var PREF_ALERT_WHITELISTED = 'alert_whitelisted';
var PREF_WHITELISTED_DEVS = 'whitelisted_devices';
var PREF_ALERT_MAC_BL     = 'alert_mac_bl';
var PREF_ALERT_MAC_NEW    = 'alert_mac_new';
var PREF_ALERT_UNAUTH_ARP = 'alert_unauth_arp';
var PREF_ALERT_TOO_MUCH_ARP  = 'alert_too_much_arp';
var PREF_ALERT_ETHER_NOT_ARP = 'alert_ether_not_arp';
var PREF_ALERT_GLOBAL_FLOOD  = 'alert_global_flood';
var PREF_ALERT_MAC_CHANGE    = 'alert_mac_change';
var PREF_ALERT_MAC_EXPIRED   = 'alert_mac_expired';

var AppletDir = imports.ui.appletManager.appletMeta[AppletUUID].path;
var ARPSENTINEL_HOME = AppletDir + '/data';
var MACLIST_BL = GLib.get_home_dir() + '/.' + AppletName +'/maclist.deny';
var MACLIST_WL = GLib.get_home_dir() + '/.'+ AppletName + '/maclist.allow';

var ALERT_NONE      =     '-1';
var ALERT_IP_CHANGE =     '0';
// XXX: action -> add to whitelist
// XXX: action -> add to blacklist
var ALERT_MAC_NOT_WL =    '1';
// XXX: action -> add to whitelist
var ALERT_MAC_BL =        '2';
var ALERT_MAC_NEW =       '3';
var ALERT_UNAUTH_ARP =    '4';
var ALERT_TOO_MUCH_ARP =  '5';
// this alert is fired when someone performs an arp spoofing
// arpsoof -t <vicimt_ip> <gw_ip>
var ALERT_ETHER_NOT_ARP = '6';
// XXX: test this, and auto add a blocking rule
var ALERT_GLOBAL_FLOOD =  '7';
var ALERT_MAC_CHANGE =    '9';
var ALERT_MAC_EXPIRED =   '10';
var ALERT_IP_DUPLICATED =   '100';

var ALERT_STATUS_NORMAL = '0';

var ICON_DIALOG_WARNING = 'dialog-warning';
var ICON_SECURITY_LOW = 'security-low';
var ICON_SECURITY_MEDIUM = 'security-medium';
var ICON_SECURITY_HIGH = 'security-high';
