# neutralinojs-builder

A complete solution to make Neutralinojs app distribution packages

## Goal

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

# Current Features

The plugin currently supports only appimage builds for the x64 and arm64 architectures.

More feutures will be added soon.

Check implementation suggestions from [here](https://github.com/neutralinojs/gsoc2022#8-neutralinojs-builder-a-community-project-to-generate-neutralino-app-packages)
