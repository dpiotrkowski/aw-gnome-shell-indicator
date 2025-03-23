/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* exported init */
import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Soup from "gi://Soup?version=3.0";
import St from "gi://St";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _("ActivityWatch status"));

      let box = new St.BoxLayout();

      box.add_child(
        new St.Icon({
          icon_name: "emoji-recent-symbolic",
          style_class: "system-status-icon",
        }),
      );

      this._statusLabel = new St.Label({
        text: "?h ??m",
        y_align: Clutter.ActorAlign.CENTER,
      });
      box.add_child(this._statusLabel);
      this.add_child(box);

      this._status = new PopupMenu.PopupImageMenuItem(
        _("All fine"),
        "view-refresh-symbolic",
      );
      this._status.hide();
      this.menu.addMenuItem(this._status);

      let item = new PopupMenu.PopupMenuItem(_("Open ActivityWatch"));
      item.connect("activate", () => {
        Gio.AppInfo.launch_default_for_uri("http://localhost:5600/", null);
      });
      this.menu.addMenuItem(item);
    }

    displayConnectionError(message) {
      this._status.label.set_text(message);
      this._status.show();
    }

    displayActivityTime() {
      this._status.hide();
    }

    setupStatusRefreshAction(extension) {
      this._status.connect("activate", () => {
        extension.fetchStatus();
      });
    }
  },
);

export default class ActivityWatchExtension extends Extension {
  constructor(meta) {
    super(meta);
    this._indicator = null;
    this._timeoutId = null;
  }

  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.metadata.uuid, this._indicator);
    this._indicator.setupStatusRefreshAction(this);

    this.fetchStatus();
    this._timeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      30,
      () => {
        this.fetchStatus();
        return GLib.SOURCE_CONTINUE;
      },
    );
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
    if (this._timeoutId) {
      GLib.Source.remove(this._timeoutId);
      this._timeoutId = null;
    }
  }

  fetchStatus() {
    let dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    let dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    let body = {
      query: [
        'afk_events = query_bucket(find_bucket("aw-watcher-afk_"));',
        'events = filter_keyvals(afk_events, "status", ["not-afk"]);',
        "RETURN = sum_durations(events);",
      ],
      timeperiods: [`${dayStart.toISOString()}/${dayEnd.toISOString()}`],
    };

    let message = Soup.Message.new("POST", "http://localhost:5600/api/0/query");
    message.set_request_body_from_bytes(
      "application/json",
      new GLib.Bytes(JSON.stringify(body)),
    );

    let session = new Soup.Session();
    session.set_timeout(5);
    session.send_and_read_async(
      message,
      GLib.PRIORITY_DEFAULT,
      null,
      (session, result) => this.retrieveStatus(session, result),
    );
  }

  retrieveStatus(session, result) {
    try {
      let bytes = session.send_and_read_finish(result);
      let decoder = new TextDecoder("utf-8");
      let response = decoder.decode(bytes.get_data());
      let data = JSON.parse(response);

      if (Array.isArray(data) && data.length === 1) {
        let seconds = data[0];
        this.displayActivityTime(seconds);
      } else {
        this.displayStatus("error");
      }
    } catch (e) {
      this.displayConnectionError();
    }
  }

  displayConnectionError() {
    this.displayStatus(_("Error"), "activity-connection-error");
    if (this._indicator) {
      this._indicator.displayConnectionError(
        _("Error: ActivityWatch not running?"),
      );
    }
  }

  displayActivityTime(todayTotalSeconds) {
    this.displayStatus(this.formatSeconds(todayTotalSeconds), "");
    if (this._indicator) {
      this._indicator.displayActivityTime();
    }
  }

  displayStatus(message, style_class) {
    if (this._indicator && this._indicator._statusLabel) {
      this._indicator._statusLabel.set_text(message);
      this._indicator._statusLabel.set_style_class_name(style_class);
    }
  }

  formatSeconds(seconds) {
    seconds = parseInt(seconds);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    minutes %= 60;

    return hours === 0
      ? `${minutes}m`
      : `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
}
