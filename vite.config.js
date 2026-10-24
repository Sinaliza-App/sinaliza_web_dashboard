import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'serve-apk-binary',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/downloads/sinaliza-app.apk') || req.url === '/downloads/sinaliza-app.apk')) {
            const rootDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : process.cwd();
            const apkPath = path.resolve(rootDir, 'public/downloads/sinaliza-app.apk');
            if (fs.existsSync(apkPath)) {
              const stat = fs.statSync(apkPath);
              res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename="Sinaliza-App-v1.2.0.apk"',
                'Cache-Control': 'no-cache'
              });
              fs.createReadStream(apkPath).pipe(res);
              return;
            }
          }
          next();
        });
      }
    }
  ],
});
