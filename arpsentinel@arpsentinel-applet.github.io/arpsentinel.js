/**
    ARP Sentinel applet for cinnamon panel
    Copyright (C) 2017-2020 Gustavo Iñiguez Goia

    This program is free software = you can redistribute it and/or modify
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

const Gio = imports.gi.Gio;
const NetworkManager = imports.gi.NM;
const Lang = imports.lang;

/* local imports */
const AppletDir = imports.ui.appletManager.appletMeta[AppletUUID].path;
const AppletObj = imports.ui.appletManager.applets[AppletUUID];
imports.searchPath.unshift(AppletDir);
const Constants = imports.constants;
const Actions = AppletObj.actions;

function ArpSentinel(){
    this._init();
}

ArpSentinel.prototype = {
    _init: function(){
        this.macs = [];
        this.alerts = [];
        this.show_alerts = [];
        /*this.show_alerts.push(Constants.ALERT_IP_CHANGE);
        this.show_alerts.push(Constants.ALERT_UNAUTH_ARP);
        this.show_alerts.push(Constants.ALERT_TOO_MUCH_ARP);
        this.show_alerts.push(Constants.ALERT_GLOBAL_FLOOD);
        this.show_alerts.push(Constants.ALERT_ETHER_NOT_ARP);
        this.show_alerts.push(Constants.ALERT_MAC_BL);
        this.show_alerts.push(Constants.ALERT_MAC_NOT_WL);
        this.show_alerts.push(Constants.ALERT_MAC_CHANGE);
        this.show_alerts.push(Constants.ALERT_MAC_EXPIRED);
        this.show_alerts.push(Constants.ALERT_IP_DUPLICATED);
        */
        this.show_alerts.push(Constants.ALERT_MAC_NEW);
        this.current_alert_level = Constants.ALERT_NONE;

        this._on_nm_client_acquired = undefined;
        NetworkManager.Client.new_async(null, Lang.bind(this, this._init_nm_client));
        this._resolver = Gio.Resolver.get_default();
    },

    _init_nm_client: function(obj, result){
        this._client = NetworkManager.Client.new_finish(result);
        this._on_nm_client_acquired(this._client);
    },

    on_nm_client: function(callback){
        this._on_nm_client_acquired = callback;
    },

    /**
     * Get latest known connectivity state
     *
     */
    get_connectivity: function(){
        return (this._client !== undefined) ? this._client.get_connectivity() : undefined;
    },

    /**
     * React to DHCP changes
     *
     * @param {function} callback - return the new connectivity state
     */
    on_dhcp_change: function(callback){
        if (this._client === undefined){
            return;
        }
        this._devices = this._client.get_devices();
        for (let i=0,len=this._devices.length; i < len;i++){
            if (this._devices[i].get_iface() === 'lo'){
                continue;
            }
            this._devices[i].connect('notify::dhcp4-config', Lang.bind(this,
                function(_dev, new_config, old_config, data){
                    callback(_dev, new_config, old_config, data);
            }));
            this._devices[i].connect('notify::dhcp6-config', Lang.bind(this,
                function(_dev, new_config, old_config, data){
                    callback(_dev, new_config, old_config, data);
            }));
        }
    },

    /**
     * React to connectivity changes
     *
     * @param {function} callback - return the new connectivity state
     */
    on_connectivity_change: function(callback){
        if (this._client === undefined){
            return;
        }

        this._devices = this._client.get_devices();
        for (let i=0,len=this._devices.length; i < len;i++){
            if (this._devices[i].get_iface() === 'lo'){
                continue;
            }
            // https://github.com/NetworkManager/NetworkManager/blob/master/clients/cli/connections.c#L2654
            this._devices[i].connect('state-changed', Lang.bind(this,
                function(_dev, new_state, old_state, reason){
                    callback(_dev, this._client.get_connectivity());
            }));
        }
    },
    
    /**
     * Adds a new entry to the list of alerts.
     *
     * @param {string} data - new device data
     * @param {string} pos - alert index
     * @param {string} pos_dev - device index
     * @param {string} pos_dupe - position of the the duplicated IP
     */
    buildAlert: function(data, pos, pos_dev, dupe_dev, callback) {
        let _icon = Constants.ICON_SECURITY_LOW;
        var pos_dev = this.get_device_by_mac(data.mac);
        if (pos_dev !== -1 && this.is_alert_id_enabled(data.type) === false){
            return;
        }
        
        if (data.type === Constants.ALERT_GLOBAL_FLOOD || 
                data.type == Constants.ALERT_ETHER_NOT_ARP || 
                data.type == Constants.ALERT_MAC_BL || 
                data.type == Constants.ALERT_TOO_MUCH_ARP){
            _icon = Constants.ICON_SECURITY_HIGH;
        }
        else if (data.type == Constants.ALERT_UNAUTH_ARP || 
            data.type == Constants.ALERT_MAC_NOT_WL){
            _icon = Constants.ICON_SECURITY_MEDIUM;
        }
        else{
            _icon = Constants.ICON_SECURITY_LOW;
        }

        switch(data.type){
            case Constants.ALERT_IP_CHANGE:
                alert_text = 'IP Change';
                if (pos_dev > -1){
                    if (this.macs[pos_dev].ip !== data.ip){
                        _alert_text = this._track_ip_changes(pos_dev, data);
                        if (_alert_text !== null){
                            alert_text = _alert_text;
                        }
                        this.macs[pos_dev] = data;
                    } else if (this.macs[pos_dev].ip === data.ip && this.macs[pos_dev].mac === data.mac ){
                        alert_text = 'IP Change (possible ARP Spoofing running)';
                    }
                }
                break;
            case Constants.ALERT_MAC_NOT_WL:
                var alert_text = 'Unknown';
                if (this.macs[pos_dev] !== undefined){
                    if (pos_dev > -1 && this.macs[pos_dev].ip === data.ip &&
                             this.macs[pos_dev].mac === data.mac){
                        return;
                    }
                }
                var _alert_text = this._track_ip_changes(pos_dev, data);
                if (_alert_text !== null){
                    alert_text = _alert_text;
                    data.type = Constants.ALERT_IP_CHANGE;
                    if (pos_dev > -1){
                        this.macs[pos_dev] = data;
                    }
                }
                //add_blacklist_mac( data );
                break;
            case Constants.ALERT_MAC_BL:
                alert_text = 'MAC blacklisted';
                break;
            case '8':
            case Constants.ALERT_MAC_NEW:
                alert_text = 'New MAC';
                _alter = this._track_ip_changes(pos_dev, data);
                if (_alter !== null){
                    alert_text = alert_text + '/' + _alter;
                }
                break;
            case Constants.ALERT_UNAUTH_ARP:
                alert_text = 'Unauthorized ARP';
                break;
            case Constants.ALERT_TOO_MUCH_ARP:
                alert_text = 'Too much ARPs';
                // TODO = block_mac(); add arp/iptables rules
                Actions.add_blacklist_mac( data, false );
                break;
            case Constants.ALERT_ETHER_NOT_ARP:
                alert_text = 'Possible ARP spoof, MAC ether != arp';
                // TODO = add visual warning, check out arp -n, etc
                let dev = this._check_arp_table(data);
                if (false !== dev){
                    global.log("ARP POISONING", dev);
                    alert_text += "\n" + dev.ip + " - " + dev.mac;
                }
                break;
            case Constants.ALERT_GLOBAL_FLOOD:
                alert_text = 'Global floood';
                // TODO = block_mac(); add arp/iptables rules
                Actions.add_blacklist_mac( data, false );
                break;
            case Constants.ALERT_MAC_CHANGE:
                // XXX = arpalert detects MAC CHANGEs, for example when it has saved a IP-MAC,
                // and later the DHCP decides to give the same IP to another device.
                alert_text = 'MAC change';
                if (pos_dev > -1 && this.macs[pos_dev].mac !== data.mac){
                    alert_text = 'MAC CHANGE (previous: ' + this.macs[pos_dev].mac + ')';
                }
                else if (pos_dev > -1 && this.macs[pos_dev].mac === data.mac &&
                    this.macs[pos_dev].ip !== data.ip){
                    alert_text = 'MAC/IP CHANGE (previous: ' + this.macs[pos_dev].ip + ')';
                    data.type = Constants.ALERT_IP_CHANGE;
                }
                // XXX = remove mac from the list
                break;
            case Constants.ALERT_MAC_EXPIRED:
                alert_text = 'MAC expired';
                this.remove_device_by_mac(data.mac);
                break;
            case Constants.ALERT_IP_DUPLICATED:
                alert_text = 'IP CONFLICT (' + dupe_dev.ip + '/' + dupe_dev.mac + ')';
                data.type = Constants.ALERT_IP_DUPLICATED;
                break;
            default:
                alert_text = 'Unknown event';
        }

        //data = this._resolve_ip(data);

        callback(alert_text + ': ' + data.mac, data, _icon);
    },

    _resolve_ip: function(data){
        try{
            if (data.ip !== '0.0.0.0'){
                let _ip = Gio.InetAddress.new_from_string(data.ip);
                //data.netname = this._resolver.lookup_by_address(_ip, null);
                let resolver = this._resolver;
                this._resolver.lookup_by_address_async(_ip, null, (x, res) => {
                    try{
                        data.netname = resolver.lookup_by_address_finish(res);
                        global.log("Host: " + data.netname);
                    }
                    catch(e){
                        global.log("resolver error: %s\n", e.message);
                    }
                });
            }
        }
        catch(e){
            global.log("_resolve_ip error" + e)
        }
        return data;
    },

    /**
     * Track IP changes of the devices.
     *
     * @param {number} pos_dev - index of the device in the local list
     * @param {onject}  dev - New device seen in the net
     * @return {string} The type of IP change, or null if nothing
     *
     */
    _track_ip_changes: function(pos_dev, dev){
        if (pos_dev === -1 && dev.ip === '0.0.0.0'){
            return "Unknown/Requesting new IP";
        }
        if (this.macs[pos_dev] === undefined){
                return null;
        }
        // real IP change
        if (this.macs[pos_dev].ip !== '0.0.0.0' && this.macs[pos_dev].ip.indexOf('169.254.') === -1 &&
                dev.ip !== '0.0.0.0' && dev.ip.indexOf('169.254.') === -1){
            return "IP Change (previous: " + this.macs[pos_dev].ip + ')';
        }
        // real IP acquired
        else if ((this.macs[pos_dev].ip === '0.0.0.0' || this.macs[pos_dev].ip.indexOf('169.254.') !== -1) &&
                dev.ip !== '0.0.0.0' && dev.ip.indexOf('169.254.') === -1){
            return "IP acquired";
        }
        // start searching for an IP
        else if (this.macs[pos_dev].ip !== '0.0.0.0' &&
                this.macs[pos_dev].ip.indexOf('169.254.') === -1 && dev.ip === '0.0.0.0'){
            return "IP lost (previous: " + this.macs[pos_dev].ip + ')';
        }
        else if (dev.ip.indexOf('169.254.') !== -1 && this.macs[pos_dev].ip === '0.0.0.0'){
            return "Failed to get IP from DHCP (again)";
        }
        // rfc5735 = Hosts obtain these addresses by auto-configuration, such as when a DHCP server cannot be found.
        else if (dev.ip.indexOf('169.254.') !== -1){
            return "Failed to get IP from DHCP";
        }
        else{
        }

        return null;
    },
    
    /**
     * Check if we've seen 2 devices with the same IP.
     *
     * @param {onject} dev - The new device to check.
     * @return {object} The device which as an IP conflict, or -1 if none.
     */
    check_ip_conflict: function(dev){
        if (this.macs.length < 2 || dev.ip === '0.0.0.0'){
            return -1;
        }
        for (let i = this.macs.length-1; i > -1; i--){
            if (this.macs[i].ip === dev.ip && this.macs[i].mac !== dev.mac){
                return this.macs[i];
            }
        }

        return -1;
    },

    add_device: function(dev){
        this.macs.push(dev);
    },

    add_alert: function(data){
        this.alerts.push(data);
    },

    /**
     * Add or remove which alerts to display to the user.
     *
     * @param {boolean} _state - state of the switch pressed
     * @param {number} _alert_id - alert id
     */
    handle_show_alerts: function(_state, _alert_id){
        let pos = this.show_alerts.indexOf(_alert_id);
        if (_state === true && pos === -1){
            this.show_alerts.push(_alert_id);
        }
        else if (_state === false && pos !== -1){
            this.show_alerts.splice(pos, 1);
        }
    },

    is_alert_id_enabled: function(_alert_id){
        return (this.show_alerts.indexOf(_alert_id) === -1) ? false : true;
    },

    add_pref_alert: function(_alert_id){
        let pos = this.show_alerts.indexOf(_alert_id);
        if (pos !== -1){
            return
        }
        this.show_alerts.push(_alert_id);
    },

    remove_pref_alert: function(_alert_id){
        let pos = this.show_alerts.indexOf(_alert_id);
        if (pos !== -1){
            this.show_alerts.splice(pos, 1);
        }
    },

    set_alert_level: function(_alert_id){
        this.current_alert_level = _alert_id;
    },

    get_alert_level: function(){
        return this.current_alert_level;
    },

    get_devices_num: function(){
        return this.macs.length;
    },

    /**
     * get device index in the list
     *
     * Without fingerprinting a device, is impossible to be sure if a device is
     * unique or not. It may have changed the MAC, etc.
     *
     * @return {object} The device index in the list.
     */
    get_device_index: function(data){
        // array.map() seems to not work
        for (let i = 0, len=this.macs.length; i < len; i++){
            // ignore duplicated alerts
            if (this.macs[i].mac === data.mac){
                return i;
                break;
            }
        }

        return -1;
    },

    /**
     * return alert index
     *
     * @return {object} The device index in the list.
     */
    get_alert_index: function(dev){
        // array.map() seems to not work
        for (let i = 0, len=this.alerts.length; i < len; i++){
            // ignore duplicated alerts
            if (this.alerts[i].mac === dev.mac && 
                this.alerts[i].ip === dev.ip && 
                this.alerts[i].type === dev.type && 
                this.alerts[i].vendor === dev.vendor && 
                this.alerts[i].device === dev.device){
                return i;
                break;
            }
        }

        return -1;
    },

    /**
     * get a device given its MAC
     *
     * @return {object} The device index in the list.
     */
    get_device_by_mac: function(mac){
        for (let i = this.macs.length-1; i > -1; i--){
            if (this.macs[i].mac === mac){
                return i;
                break;
            }
        }
        return -1;
    },

    /**
     * Removes a device from the list by its MAC address.
     *
     */
    remove_device_by_mac: function(mac){
        let idx = this.get_device_by_mac(mac);
        if (idx !== -1){
            let ret = this.macs.slice(idx,1);
   //         this.update_devices_list();
            return ret;
        }
        return false;
    },

    /**
     * Removes a device from the list by its MAC address.
     *
     */
    check_arp_table: function(mac){
        let file = Gio.file_new_for_path("/proc/net/arp");
        let [result, content, etag] = file.load_contents(null);
        for (let s of content.toString().split('\n')){
            let match = new RegExp('([0-9\.]+).+([A-Za-z0-9\:]{17}).*').exec(s);
            if (match){
                let dev = {ip: match[1], mac: match[2]};
                if (false !== Actions.is_whitelisted(dev)){
                    return dev;
                }
            }
        }
        return false;
    },

    reset_lists: function(){
        this.alerts = [];
        this.macs = [];
    },

    destroy: function(){
        this.reset_lists();
        this.show_alerts.length = 0;
    }
}
