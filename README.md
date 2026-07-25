# neutralinojs-builder

`neutralinojs-builder` is a lightweight neu CLI plugin for generating platform-specific installers and distributable packages for Neutralinojs applications.

It sits on top of the existing neu build workflow and automates packaging for different platforms using the appropriate native tools. The goal is to keep the Neutralinojs CLI minimal while still making app distribution easy and consistent.

---

## Features

- Plugin-based integration with the `neu` CLI
- Platform-specific installer/package generation
- Support for multiple CPU architectures
- Shared staging and packaging workflow
- SEA (Single Executable Application) awareness
- Configuration-driven builds through `neutralino.config.json`
- Modular target architecture for future extensibility

---

## Supported Targets

| Target | Output |
|---|---|
| NSIS | `.exe` Windows installer |
| Debian | `.deb` package |
| AppImage | `.AppImage` package |
| DMG | `.dmg` macOS installer |

---

## Installation

```bash
# Installing the plugin
neu plugins --add @neutralinojs-contrib/builder

# neu builder [target] [options]
neu builder nsis    # NSIS setup for Windows x64
neu builder deb     # Debian package for GNU/Linux
neu builder appimage # AppImage for GNU/Linux x64
neu builder dmg     # DMG installer for macOS

# Removing the plugin
neu plugins --remove @neutralinojs-contrib/builder
```

---

## Progress

- [x] Task 1: Plugin core initializer (SEA support)
- [x] Task 2: Configuration & dependency pre-check
- [x] Task 3: Windows NSIS installer
- [x] Task 4: Linux DEB package
- [ ] Task 5: Linux AppImage
- [ ] Task 6: macOS DMG installer
- [x] Task 7: CLI integration
- [ ] Task 8: Testing & CI/CD pipeline
- [ ] Task 9: Documentation & refinement

---

## Development Status

This project is currently under active development. The first pre-release (v0.1.0) supporting DEB and NSIS generation is expected soon. AppImage and DMG support will follow in subsequent releases.