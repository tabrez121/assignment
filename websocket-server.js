/**
 * Simple WebSocket Server for Testing
 * 
 * This server simulates the backend WebSocket API for the ClearSpot.ai frontend
 * 
 * Usage:
 *   npm install ws
 *   node websocket-server.js
 * 
 * Then the frontend will connect to ws://localhost:8080/api/alarms
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import process from 'process';

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/api/alarms' });

console.log('🚀 WebSocket Server Starting...');
console.log('📍 Server will listen on ws://localhost:8080/api/alarms');
console.log('');

// Mock alarms database
const alarms = [
  {
    id: 'alarm-001',
    siteId: 'site-1',
    severity: 'critical',
    message: 'Power supply failure detected',
    status: 'active',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'alarm-002',
    siteId: 'site-2',
    severity: 'high',
    message: 'Temperature threshold exceeded',
    status: 'active',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 'alarm-003',
    siteId: 'site-3',
    severity: 'high',
    message: 'Humidity level critical',
    status: 'active',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'alarm-004',
    siteId: 'site-1',
    severity: 'medium',
    message: 'Connection timeout - device unresponsive',
    status: 'active',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: 'alarm-005',
    siteId: 'site-4',
    severity: 'low',
    message: 'Maintenance reminder - filter replacement due',
    status: 'active',
    timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
  },
];

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ Client connected from ${clientIp}`);
  console.log(`📊 Total clients: ${wss.clients.size}`);
  console.log('');

  // Send initial alarms to client
  setTimeout(() => {
    const message = {
      event: 'alarm.list',
      data: alarms,
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(message));
    console.log(`📤 Sent initial alarms to ${clientIp}`);
  }, 500);

  // Simulate new alarms every 30 seconds
  const alarmInterval = setInterval(() => {
    const severities = ['critical', 'high', 'medium', 'low'];
    const newAlarm = {
      id: `alarm-${Date.now()}`,
      siteId: `site-${Math.floor(Math.random() * 4) + 1}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: `Simulated alert at ${new Date().toLocaleTimeString()}`,
      status: 'active',
      timestamp: new Date().toISOString(),
    };

    const message = {
      event: 'alarm.created',
      data: newAlarm,
      timestamp: new Date().toISOString(),
    };

    ws.send(JSON.stringify(message));
    console.log(`📨 Sent new alarm: ${newAlarm.id}`);
  }, 30000);

  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📥 Received message from ${clientIp}:`, message.action || message.event);

      // Handle alarm acknowledgment
      if (message.action === 'acknowledge') {
        const alarm = alarms.find((a) => a.id === message.alarmId);
        if (alarm) {
          alarm.status = 'acknowledged';
          alarm.acknowledgedBy = message.acknowledgedBy;

          const response = {
            event: 'alarm.acknowledged',
            data: {
              id: message.alarmId,
              acknowledgedBy: message.acknowledgedBy,
              timestamp: new Date().toISOString(),
            },
          };
          ws.send(JSON.stringify(response));
          console.log(`✅ Acknowledged alarm: ${message.alarmId}`);
        }
      }

      // Handle alarm resolution
      if (message.action === 'resolve') {
        const alarm = alarms.find((a) => a.id === message.alarmId);
        if (alarm) {
          alarm.status = 'resolved';
          alarm.resolvedAt = new Date().toISOString();

          const response = {
            event: 'alarm.resolved',
            data: {
              id: message.alarmId,
              resolvedAt: new Date().toISOString(),
            },
          };
          ws.send(JSON.stringify(response));
          console.log(`✅ Resolved alarm: ${message.alarmId}`);
        }
      }

      // Handle heartbeat/ping
      if (message.action === 'ping') {
        ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (err) {
      console.error('❌ Error processing message:', err.message);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    clearInterval(alarmInterval);
    console.log(`⚠️ Client disconnected from ${clientIp}`);
    console.log(`📊 Total clients: ${wss.clients.size}`);
    console.log('');
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`❌ WebSocket error from ${clientIp}:`, err.message);
  });
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Start server
const PORT = 8080;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ WebSocket Server Running!`);
  console.log(`🌐 WebSocket URL: ws://localhost:${PORT}/api/alarms`);
  console.log('');
  console.log('Features:');
  console.log('  - Sends initial alarms on connection');
  console.log('  - Simulates new alarms every 30 seconds');
  console.log('  - Handles alarm acknowledgment');
  console.log('  - Handles alarm resolution');
  console.log('  - Supports heartbeat/ping messages');
  console.log('');
  console.log('Frontend should automatically connect when you start the app.');
  console.log('Press Ctrl+C to stop the server.');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
});

// Log broadcast
console.log(`📊 Monitoring ${wss.clients.size} clients`);
setInterval(() => {
  if (wss.clients.size > 0) {
    // Optional: send status updates to all clients
  }
}, 5000);
