# neutralinojs-builder

``neutralinojs-builder`` is a lightweight neu CLI plugin for generating platform-specific installers and distributable packages for Neutralinojs applications.

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
neu plugins --add @neutralinojs-community/builder

# neu builder [target] [options]
neu builder nsis --x64 # NSIS setup for Windows x64
neu builder deb --ia32 # Debian package for GNU/Linux ia32
neu builder appimage --x64 # AppImage for GNU/Linux x64
neu builder deb # GNU/Linux Debian packages for all supported CPU architectures

# Use configuration from neutralino.config.json
neu builder

# Removing the plugin
neu plugins --remove @neutralinojs-community/builder
```

## Development Status
This project is currently under active development and the initial release is expected soon. The architecture and implementation may evolve during development as the packaging pipeline and platform targets change.