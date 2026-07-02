!include "MUI2.nsh"

Name "{{APP_NAME}}"
OutFile "{{OUTPUT_FILE}}"
InstallDir "$PROGRAMFILES64\{{APP_NAME}}"
RequestExecutionLevel admin

!define MUI_ICON "{{ICON_PATH}}"
!define MUI_UNICON "{{ICON_PATH}}"

{{SIDEBAR_BLOCK}}
{{HEADER_BLOCK}}
{{LICENSE_BLOCK}}

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
    SetOutPath "$INSTDIR"
    File "{{BINARY_PATH}}"
    {{RESOURCES_LINE}}

    CreateDirectory "$SMPROGRAMS\{{APP_NAME}}"
    CreateShortcut "$SMPROGRAMS\{{APP_NAME}}\{{APP_NAME}}.lnk" "$INSTDIR\{{BINARY_NAME}}"
    CreateShortcut "$DESKTOP\{{APP_NAME}}.lnk" "$INSTDIR\{{BINARY_NAME}}"

    WriteUninstaller "$INSTDIR\uninstall.exe"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{{APP_ID}}" \
        "DisplayName" "{{APP_NAME}}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{{APP_ID}}" \
        "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\{{BINARY_NAME}}"
    Delete "$INSTDIR\resources.neu"
    Delete "$INSTDIR\uninstall.exe"
    RMDir "$INSTDIR"

    Delete "$SMPROGRAMS\{{APP_NAME}}\{{APP_NAME}}.lnk"
    RMDir "$SMPROGRAMS\{{APP_NAME}}"
    Delete "$DESKTOP\{{APP_NAME}}.lnk"

    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{{APP_ID}}"
SectionEnd