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

let macs_in_whitelist = "";
load_whitelist();

function load_whitelist(){
    let file = Gio.file_new_for_path(Constants.MACLIST_WL);
    let [result, fcontent, etag] = file.load_contents(null);
    macs_in_whitelist = fcontent.toString();
    GLib.free(fcontent);
}

function save_whitelist(content){
    macs_in_whitelist = content;
    let file = Gio.file_new_for_path(Constants.MACLIST_WL);
    let out_stream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
    var dstream = new Gio.DataOutputStream({base_stream: out_stream});
    dstream.put_string(content, null);
    out_stream.close(null); // null must appear, otherwise it never ends
}

/**
 * Check if the device is whitelisted, and return the details, or false otherwise.
 * There're 3 states:
 * - not found in the list / not whitelisted
 * - tuple ip-mac equals
 * - ip equals to whitelisted, but mac changed -> alert
 * TODO: support multiple IPs with different MACs
 */
function is_whitelisted(dev){
    // TODO: split the list globally
    let wl_devs = macs_in_whitelist.split('\n');
    for (var i=0,len=wl_devs.length;i < len;i++){
        // first we find the ip.
        // if it's in the wl list, check if the ip-mac tuple equals
        if (wl_devs[i][0] === '#'){
            continue;
        }
        if (wl_devs[i].indexOf(dev.ip) !== -1 &&
            macs_in_whitelist.toUpperCase().indexOf(dev.mac.toUpperCase() + " " + dev.ip.toUpperCase()) === -1){
            global.log('is_whitelisted: FOUND, ' + wl_devs[i]);
            return wl_devs[i];
        }
    }
    return false;
}

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
//  global.log('ACTIONS WL');
    if (data.mac.split(':').length !== 6){
        global.log('ACTIONS WL, BAD MAC: ' + data.mac);
        return;
    }

    let file = Gio.file_new_for_path(Constants.MACLIST_WL);
    let [result, fcontent, etag] = file.load_contents(null); 
    mac_found = macs_in_whitelist.indexOf(data.mac);
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

    macs_in_whitelist = macs_in_whitelist + data.mac + " " + data.ip + " " + data.device + " \n";
    return macs_in_whitelist;
}

function add_blacklist_mac(data, force){
//    global.log('ACTIONS BL');
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

