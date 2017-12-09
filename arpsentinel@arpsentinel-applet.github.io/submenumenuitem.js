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

const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const MenuApi = imports.ui.popupMenu;
const Lang = imports.lang;

function SubMenuMenuItem() {
    this._init.apply(this, arguments);
}

/**
 * Custom PopupSubMenuMenuItem which adds an icon to each item
 * @see: /usr/share/cinnamon/js/ui/popupMenu.js:2836
 *
 */
SubMenuMenuItem.prototype = {
    __proto__: MenuApi.PopupBaseMenuItem.prototype,

    /**
     * _init:
     * @_icon (string): icon name
     * @_text (string): text of the item
     */
    _init: function(_icon, _text) {
        MenuApi.PopupBaseMenuItem.prototype._init.call(this);
        
        this.actor.add_style_class_name('popup-submenu-menu-item');

        this.icon = new St.Icon({ icon_name: _icon,
                 icon_type: St.IconType.FULLCOLOR,
                 icon_size: 24,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'popup-menu-icon'
        });
        this.addActor(this.icon, { span: 0 });

        this.label = new St.Label({
            text: _text,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.addActor(this.label);
        this.actor.label_actor = this.label;
        
        this._triangleBin = new St.Bin({ x_align: St.Align.END });
        this.addActor(this._triangleBin, { expand: true,
                                           span: -1,
                                           align: St.Align.END });

        this._triangle = MenuApi.arrowIcon(St.Side.RIGHT);
        this._triangle.pivot_point = new Clutter.Point({ x: 0.5, y: 0.6 });
        this._triangleBin.child = this._triangle;

        this.menu = new MenuApi.PopupSubMenu(this.actor, this._triangle);
        this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));
    },
    
    destroy: function() {
        this.menu.destroy();
        MenuApi.PopupBaseMenuItem.prototype.destroy.call(this);
    },
    
    _subMenuOpenStateChanged: function(menu, open) {
        this.actor.change_style_pseudo_class('open', open);
    },
    
    activate: function(event) {
        this.menu.open(true);
    },
    
    _onButtonReleaseEvent: function(actor) {
        this.menu.toggle();
    }
};

