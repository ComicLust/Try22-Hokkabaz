// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const basePort = Number(process.env.PORT ?? 3000);
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server with port fallback on EADDRINUSE
    const tryListen = (port: number, attemptsLeft: number) => {
      server.once('error', (err: any) => {
        if (err?.code === 'EADDRINUSE' && attemptsLeft > 0) {
          const nextPort = port + 1;
          console.warn(`Port ${port} in use. Retrying on ${nextPort}...`);
          tryListen(nextPort, attemptsLeft - 1);
        } else {
          console.error('Server startup error:', err);
          process.exit(1);
        }
      });
      server.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running at ws://${hostname}:${port}/api/socketio`);
      });
    };

    tryListen(basePort, 5);

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
