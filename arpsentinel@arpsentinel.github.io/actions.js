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

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const AppletUUID = 'arpsentinel@arpsentinel-applet.github.io';
const AppletDir = imports.ui.appletManager.appletMeta[AppletUUID].path;
imports.searchPath.unshift(AppletDir);
const Constants = imports.constants;

/**
 * Add a MAC to the white list
 * It must be deleted from the blacklist, if it's added.
 *
 */
function add_whitelist_mac(data, force){
    // https://people.gnome.org/~gcampagna/docs/Gio-2.0/index.html
    // https://people.gnome.org/~gcampagna/docs/Gio-2.0/Gio.File.html
    // https://people.gnome.org/~gcampagna/docs/Gio-2.0/Gio.OutputStream.html
    // https://people.gnome.org/~gcampagna/docs/Gio-2.0/Gio.File.append_to.html
    //
    // https://foreachsam.github.io/book-lang-javascript-gjs/book/content/gio/file-load-contents.html
    // 
    // file_new_for_path() home is ~ of current user.
    global.log('ACTIONS WL');
    if (data.mac.split(':').length !== 6){
        global.log('ACTIONS WL, BAD MAC: ' + data.mac);
        return;
    }

    let file = Gio.file_new_for_path(Constants.MACLIST_WL);
    let [result, fcontent, etag] = file.load_contents(null); 
    mac_found = fcontent.toString().indexOf(data.mac);
    if (mac_found === -1){
        let out_stream = file.append_to(Gio.FileCreateFlags.NONE, null);
        out_stream.write(data.mac + ' ' + data.ip + ' ' + data.device + ' \n', null, null, null);
        out_stream.close(null); // null must appear, otherwise it never ends
    }
    GLib.free(fcontent);

    // delete MAC from whitelist if it exists
    if (force === true){
        remove_mac_from_file(data.mac, Constants.MACLIST_BL);
    }
}

function add_blacklist_mac(data, force){
    global.log('ACTIONS BL');
    if (data.mac.split(':').length !== 6){
        global.log('ACTIONS BL, BAD MAC: ' + data.mac);
        return;
    }

    let file = Gio.file_new_for_path(Constants.MACLIST_BL);
    // if not null, it waits indefinitely
    // the file must exist.
    let [result, fcontent, etag] = file.load_contents(null); 
    mac_found = fcontent.toString().indexOf(data.mac);
    if (mac_found === -1){
        let out_stream = file.append_to(Gio.FileCreateFlags.NONE, null);
        out_stream.write(data.mac + ' ' + data.ip + ' ' + data.device + ' ' + 
                Constants.POLICY_IGNORE_BLISTED + ' ' +
                '\n', null, null, null);
        out_stream.close(null);
    }
    GLib.free(fcontent);
    
    // delete MAC from whitelist if it exists
    if (force === true){
        remove_mac_from_file(data.mac, Constants.MACLIST_WL);
    }
}

function remove_mac_from_file(mac, macs_file){
    let file = Gio.file_new_for_path( macs_file );
    // if not null, it waits indefinitely
    // the file must exist.
    let [result, fcontent, etag] = file.load_contents(null);
    // XXX: we may need to delete the tuple "mac ip"
    let re = new RegExp("^" + mac + ".*$", "gm");
    let content = fcontent.toString();
    let newContent = content.replace(re, '');
    if (newContent.length !== content.length){
        var stream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
        stream.write(newContent, null, null, null);
        stream.close(null);
    }
    GLib.free(fcontent);
    newContent = '';
    content = '';
}

