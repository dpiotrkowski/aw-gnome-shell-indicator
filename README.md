## ActivityWatch status
---

Gnome Shell extension that displays the total active time in the main panel,
as tracked by [ActivityWatch](https://activitywatch.net/). Forked from [cweiske](https://codeberg.org/cweiske/activitywatch-status-gnome-shell) and updated for GNOME Shell 45+.

### Requirements

- ActivityWatch instance running on `http://localhost:5600/`.

> [!IMPORTANT]
> It is recommended to use [awatcher](https://github.com/2e3s/awatcher) which also requires [this extension](https://extensions.gnome.org/extension/5592/focused-window-d-bus/) to be installed.


## Manual installation
---
**Requirements:** `git`, `just`

Manually clone the repository in the right location:

```

  git clone https://github.com/dpiotrkowski/activitywatch-status-gnome-shell.git
  cd activitywatch-status-gnome-shell
  just install

```
Now restart gnome shell by logging off and in again (Wayland) or Alt+F2 -> r -> Enter (X11).

Enable the extension:
```
  gnome-extensions enable activitywatch-status@dpiotrkowski.github.io

```
### Future plans

- [ ] Add customizable notifications.
- [ ] Add customizable daily screen time limit.
