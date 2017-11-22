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

const AppletUUID = 'arpsentinel@arpsentinel-applet.github.io';

const SIGNAL_EVENTS_METHOD      =   'getAlert';

const POLICY_IGNORE_IPCHANGE    =   'ip_change';
const POLICY_IGNORE_BLISTED     =   'black_listed';
const POLICY_IGNORE_UNAUTH      =   'unauth_rq';
const POLICY_IGNORE_ABUSE       =   'rq_abus';
const POLICY_IGNORE_MAC_ERROR   =   'mac_error';
const POLICY_IGNORE_MAC_CHANGE  =   'mac_change';

const PREF_HARDENING_MODE   = 'hardening_mode';
const PREF_MAX_DEVICES      = 'max_devices';
const PREF_CHECK_HTTPS      = 'check_https';
const PREF_HTTPS_INTERVAL   = 'https_interval';
const PREF_HTTPS_DOMAINS    = 'https_domains';
const PREF_BLOCK_COMMAND    = 'block_command';
const PREF_ALERT_IP_CHANGE  = 'alert_ip_change';
const PREF_ALERT_MAC_NOT_WL = 'alert_mac_not_wl';
const PREF_ALERT_MAC_BL     = 'alert_mac_bl';
const PREF_ALERT_MAC_NEW    = 'alert_mac_new';
const PREF_ALERT_UNAUTH_ARP = 'alert_unauth_arp';
const PREF_ALERT_TOO_MUCH_ARP  = 'alert_too_much_arp';
const PREF_ALERT_ETHER_NOT_ARP = 'alert_ether_not_arp';
const PREF_ALERT_GLOBAL_FLOOD  = 'alert_global_flood';
const PREF_ALERT_MAC_CHANGE    = 'alert_mac_change';
const PREF_ALERT_MAC_EXPIRED   = 'alert_mac_expired';

const AppletDir = imports.ui.appletManager.appletMeta[AppletUUID].path;
const ARPSENTINEL_HOME = AppletDir + '/data';
const MACLIST_BL = ARPSENTINEL_HOME + '/maclist.deny';
const MACLIST_WL = ARPSENTINEL_HOME + '/maclist.allow';
const MACLIST_TRUSTED = ARPSENTINEL_HOME + '/maclist.trusted';

const ALERT_IP_CHANGE =     '0';
// XXX: action -> add to whitelist
// XXX: action -> add to blacklist
const ALERT_MAC_NOT_WL =    '1';
// XXX: action -> add to whitelist
const ALERT_MAC_BL =        '2';
const ALERT_MAC_NEW =       '3';
const ALERT_UNAUTH_ARP =    '4';
const ALERT_TOO_MUCH_ARP =  '5';
// this alert is fired when someone performs an arp spoofing
// arpsoof -t <vicimt_ip> <gw_ip>
const ALERT_ETHER_NOT_ARP = '6';
// XXX: test this, and auto add a blocking rule
const ALERT_GLOBAL_FLOOD =  '7';
const ALERT_MAC_CHANGE =    '9';
const ALERT_MAC_EXPIRED =   '10';
const ALERT_IP_DUPLICATED =   '100';

const ALERT_STATUS_NORMAL = '0';

