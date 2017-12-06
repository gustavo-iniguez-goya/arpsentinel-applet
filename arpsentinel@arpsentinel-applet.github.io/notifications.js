/**
    ARP Sentinel applet for cinnamon panel
    Copyright (C) 2017 Gustavo Iñiguez Goia

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

/* local imports */
const AppletDir = imports.ui.appletManager.appletMeta[AppletUUID].path;
const AppletObj = imports.ui.appletManager.applets[AppletUUID];
imports.searchPath.unshift(AppletDir);
const Constants = imports.constants;
const Actions = AppletObj.actions;

const Main = imports.ui.main;
const Tray = imports.ui.messageTray;
const St = imports.gi.St;
const Lang = imports.lang;

function Notifications(){
    this.NONE                = -1;
    this.TYPE_MAC_CHANGE     = 0;
    this.TYPE_IP_DUPLICATED  = 1;
    this.TYPE_MAX_DEVICES    = 2;
    this.TYPE_TRUSTED_CHANGE = 3;
    this.TYPE_ARP_SPOOFING   = 10;
    this.TYPE_GLOBAL_FLOOD   = 10;
    this.TYPE_MITM           = 10;

    this.notif_active = this.NONE;

    this._notif_src = new Tray.Source("banner");
    Main.messageTray.add(this._notif_src);

    /**
     * Show a notification to the user
     *
     * @param {string} _title - Title of the notification
     * @param {string} _body - Body of the notification
     * @param {string} _ic_name - Icon name
     * @param {string} _urgency - Notification urgency
     * @param {number} _type - Notification type
     */
    this.show = function(_title, _body, _ic_name, _urgency, _type){
        if (this.notif_active === _type){
            global.log('ACTIVE: ' + _type);
            return;
        }
        let not = new Tray.Notification(this._notif_src, _title, _body, 
            {
                bodyMarkup: true,
                bannerMarkup: true,
                icon:  new St.Icon({ icon_name: _ic_name,
                             icon_type: St.IconType.SYMBOLIC,
                             icon_size: 24 })
            });
        // make the notification not auto hide
        not.setUrgency(_urgency);
        not.connect('clicked', Lang.bind(this, function(){
            this.notif_active = this.NONE;
        }));
        this._notif_src.notify(not);
        this.notif_active = _type;
    };
    
    this.show_warning = function(_title, _body, _ic_name){
        this.show(_title, _body, _ic_name);
    };
}
