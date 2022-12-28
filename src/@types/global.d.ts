type NeuModules = {
  bundler: {
    bundleApp: (isRelease?: boolean, copyStorage?: boolean) => Promise<void>;
  };
  creator: {
    bundleApp: (binaryName: string, template?: string) => Promise<void>;
  };
  config: {
    get: () => any;
    update: (key: string, value: any) => void;
  };
  downloader: {
    downloadTemplate: (template: string) => Promise<void>;
    downloadAndUpdateBinaries: () => Promise<void>;
    downloadAndUpdateClient: () => Promise<void>;
  };
  runner: {
    runApp: (options: { argsOpt: string; arch: string }) => Promise<void>;
  };
  websocket: {
    start: (options: Record<string, any>) => void;
    stop: () => void;
    dispatch: (event: string, data: any) => void;
  };
};
