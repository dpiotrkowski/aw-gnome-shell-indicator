## 2025-03-23
**Changed**
- Ported imports to comply with [GNOME Shell 45 requirements](https://gjs.guide/extensions/upgrading/gnome-shell-45.html):
  - Replaced imports.gi with explicit imports from `gi:// namespace`
  - Updated UI imports to use `resource:///org/gnome/shell/ui/` path
  - Imported Extension and `gettext` from `resource:///org/gnome/shell/extensions/extension.js`
- Updated extension structure to use ES6 module syntax
- Modified init function to return an instance of `ActivityWatchExtension`
- Replaced *Makefile* in favor of *Justfile*
