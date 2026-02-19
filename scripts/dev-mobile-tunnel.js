#!/usr/bin/env node
/**
 * iPhone için: Cloudflared ile Metro (8081) tüneller, Expo'yu bu URL ile başlatır.
 * Expo'nun ngrok tunnel'ı timeout verdiğinde bu script kullanılır.
 *
 * Kullanım: node scripts/dev-mobile-tunnel.js
 * veya: pnpm dev:mobile:tunnel
 */

const { spawn } = require('child_process');
const path = require('path');

const METRO_PORT = 8081;

function extractCloudflaredUrl(text) {
  // cloudflared output: "Your quick Tunnel has been created! Visit https://xxx.trycloudflare.com"
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  return match ? match[0] : null;
}

function main() {
  let cloudflaredUrl = null;
  const cloudflared = spawn('npx', ['cloudflared', 'tunnel', '--url', `http://localhost:${METRO_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  cloudflared.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    if (!cloudflaredUrl) {
      cloudflaredUrl = extractCloudflaredUrl(text);
      if (cloudflaredUrl) {
        console.log('\n--- Metro tunnel hazır, Expo başlatılıyor... ---\n');
        const expo = spawn('npx', ['expo', 'start', '--clear'], {
          env: { ...process.env, EXPO_PACKAGER_PROXY_URL: cloudflaredUrl },
          stdio: 'inherit',
          shell: true,
          cwd: path.resolve(__dirname, '../apps/mobile'),
        });
        expo.on('exit', (code) => {
          cloudflared.kill();
          process.exit(code ?? 0);
        });
      }
    }
  });

  cloudflared.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
    if (!cloudflaredUrl) {
      cloudflaredUrl = extractCloudflaredUrl(text);
      if (cloudflaredUrl) {
        console.log('\n--- Metro tunnel hazır, Expo başlatılıyor... ---\n');
        const expo = spawn('npx', ['expo', 'start', '--clear'], {
          env: { ...process.env, EXPO_PACKAGER_PROXY_URL: cloudflaredUrl },
          stdio: 'inherit',
          shell: true,
          cwd: path.resolve(__dirname, '../apps/mobile'),
        });
        expo.on('exit', (code) => {
          cloudflared.kill();
          process.exit(code ?? 0);
        });
      }
    }
  });

  cloudflared.on('error', (err) => {
    console.error('Cloudflared başlatılamadı:', err.message);
    console.error('Cloudflared yüklü mü? npx cloudflared --version');
    process.exit(1);
  });

  // 30 saniye içinde URL gelmezse uyar
  setTimeout(() => {
    if (!cloudflaredUrl) {
      console.warn('\nHenüz tunnel URL alınamadı. Cloudflared çıktısını kontrol edin.');
    }
  }, 30000);
}

main();
