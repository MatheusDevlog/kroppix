; Instalador do Kroppix (Inno Setup)
#define MyAppName "Kroppix"
#define MyAppVersion "1.0"
#define MyAppExeName "Kroppix.exe"

[Setup]
AppId={{8F3A1C24-9B7E-4E2A-A1D6-5C2F7B0E9A11}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher=Matheus
DefaultDirName={localappdata}\Programs\Kroppix
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
; Caminhos relativos a este .iss (pasta build/), portaveis entre maquinas
OutputDir=..\dist_installer
OutputBaseFilename=Kroppix-Setup
SetupIconFile=kroppix.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
; Reinstalar por cima fecha o app aberto e sobrescreve a versão antiga (sem duplicar)
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar um atalho na Área de Trabalho"; GroupDescription: "Atalhos adicionais:"

[Files]
Source: "..\dist\Kroppix\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir o {#MyAppName} agora"; Flags: nowait postinstall skipifsilent
