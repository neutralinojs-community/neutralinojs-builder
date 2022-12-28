const esbuild = require('esbuild')

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals')

esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist',
    bundle: true,
    minify: false, // TODO: Make this change based on environment variable
    platform: 'node',
    sourcemap: true,
    target: 'node14',
    plugins: [nodeExternalsPlugin()]
}).catch(() => process.exit(1))