import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generatedCatalogPath, projectRoot, publicationsPath, scanPublications } from './publications.mjs';

const contentTypes = {
  '.pdf': 'application/pdf', '.zip': 'application/zip', '.png': 'image/png', '.bib': 'text/plain; charset=utf-8',
};

export function publicationsPlugin(root = projectRoot) {
  const catalogPath = generatedCatalogPath(root);
  const sourceRoot = publicationsPath(root);
  let production = false;
  let buildCatalog;

  return {
    name: 'directory-publications',
    enforce: 'pre',
    configResolved(config) {
      production = config.command === 'build';
    },
    async buildStart() {
      if (production) buildCatalog = await scanPublications(root, { includeIgnored: false });
    },
    resolveId(source, importer) {
      const cleanSource = source.split('?')[0];
      if (cleanSource === '/src/data/publications.generated.json') return catalogPath;
      const resolved = path.resolve(importer ? path.dirname(importer.split('?')[0]) : root, cleanSource);
      if (resolved === catalogPath) return catalogPath;
    },
    async load(id) {
      if (id.split('?')[0] !== catalogPath) return;
      // Never trust a cached local index for production. This also keeps a
      // simultaneous dev server and build from sharing private metadata.
      const catalog = production ? buildCatalog : await scanPublications(root);
      return JSON.stringify(catalog.publications);
    },
    configureServer(server) {
      server.watcher.add(sourceRoot);
      const reload = (filename) => {
        if (!filename.startsWith(`${sourceRoot}${path.sep}`)) return;
        const module = server.moduleGraph.getModuleById(catalogPath);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload', path: '*' });
      };
      server.watcher.on('add', reload).on('change', reload).on('unlink', reload);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', reload).off('change', reload).off('unlink', reload);
      });
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\//, '');
        } catch {
          return next();
        }
        if (!pathname.startsWith('assets/publications/')) return next();
        try {
          const catalog = await scanPublications(root);
          const asset = catalog.assets.find(({ url }) => url === pathname);
          if (!asset) {
            response.statusCode = 404;
            response.end('Publication resource not found');
            return;
          }
          if (!['GET', 'HEAD'].includes(request.method)) {
            response.statusCode = 405;
            response.end();
            return;
          }
          response.setHeader('Content-Type', contentTypes[path.extname(asset.filePath)] || 'application/octet-stream');
          if (request.method === 'HEAD') return response.end();
          createReadStream(asset.filePath).on('error', () => {
            response.statusCode = 404;
            response.end();
          }).pipe(response);
        } catch (error) {
          next(error);
        }
      });
    },
    async generateBundle() {
      for (const asset of buildCatalog?.assets || []) {
        this.emitFile({ type: 'asset', fileName: asset.url, source: await readFile(asset.filePath) });
      }
    },
  };
}
