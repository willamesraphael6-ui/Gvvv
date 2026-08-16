import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://admin.securenet.com,https://lovable.app').split(',');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
    }
  }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.MAX_REQUESTS_PER_MINUTE || 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiRateLimiter);
app.use('/webhooks/', apiRateLimiter);

const mockAdminToken = process.env.JWT_SECRET || 'dev_only_admin_token';
const mockApiKeyHash = 'sha256:demo_api_key_hash';

const regionList = [
  { id: 'br', name: 'Brasil', country: '🇧🇷', ping: 18, load: 'low', status: 'online', speed: 'high', city: 'São Paulo' },
  { id: 'us', name: 'Estados Unidos', country: '🇺🇸', ping: 42, load: 'medium', status: 'online', speed: 'high', city: 'Virginia' },
  { id: 'ca', name: 'Canadá', country: '🇨🇦', ping: 55, load: 'medium', status: 'online', speed: 'medium', city: 'Toronto' },
  { id: 'de', name: 'Alemanha', country: '🇩🇪', ping: 68, load: 'low', status: 'online', speed: 'medium', city: 'Frankfurt' },
  { id: 'uk', name: 'Reino Unido', country: '🇬🇧', ping: 71, load: 'medium', status: 'online', speed: 'medium', city: 'London' },
  { id: 'jp', name: 'Japão', country: '🇯🇵', ping: 110, load: 'medium', status: 'online', speed: 'medium', city: 'Tokyo' }
];

const serverList = [
  { id: 'srv-br-1', region: 'Brasil', country: '🇧🇷', ip: '203.0.113.10', status: 'online', cpu: 28, ram: 52, traffic: '12 TB', uptime: '99.98%', connectedUsers: 421 },
  { id: 'srv-us-1', region: 'Estados Unidos', country: '🇺🇸', ip: '198.51.100.10', status: 'online', cpu: 32, ram: 60, traffic: '18 TB', uptime: '99.96%', connectedUsers: 512 },
  { id: 'srv-ca-1', region: 'Canadá', country: '🇨🇦', ip: '192.0.2.20', status: 'online', cpu: 30, ram: 57, traffic: '9 TB', uptime: '99.94%', connectedUsers: 289 }
];

const appStatus = {
  vpsIp: process.env.VPS_IP || '203.0.113.10',
  domain: process.env.VPS_DOMAIN || 'api.securenet.com',
  vpnStatus: 'online',
  dnsStatus: 'online',
  connectedUsers: 1284,
  trafficUsed: '98.4 TB',
  uptime: '365d 6h 42m',
  cpu: 31,
  ram: 58,
  storage: 72,
  temperature: 54,
  network: { in: '144 Mbps', out: '121 Mbps' }
};

const threatFeeds = [
  { id: 'mal-1', name: 'Malware', category: 'Malware', risk: 'high', status: 'active' },
  { id: 'phish-2', name: 'Phishing', category: 'Phishing', risk: 'high', status: 'active' },
  { id: 'ad-3', name: 'Adware', category: 'Adware malicioso', risk: 'medium', status: 'active' }
];

const auditLogs = [
  { id: 'evt-1', ts: '2026-08-17T08:32:12Z', type: 'security', message: 'APK suspeito bloqueado e enviado para quarentena.' },
  { id: 'evt-2', ts: '2026-08-17T08:54:01Z', type: 'vpn', message: 'Usuário conectado ao servidor Brasil.' },
  { id: 'evt-3', ts: '2026-08-17T09:10:40Z', type: 'dns', message: 'Registro DNS atualizado em api.securenet.com.' }
];

function normalizeEndpointPath(pathname) {
  return pathname.replace(/\/+/g, '/');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'securenet-platform' });
});

app.get('/api/v1/status', (req, res) => {
  res.json({
    service: 'SecureNet VPN',
    status: 'operational',
    vps: appStatus,
    servers: serverList.length,
    regions: regionList.length,
    dns: 'active',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { username, password, otp } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (username !== 'admin' || password !== 'admin123') {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  if (otp && otp !== '123456') {
    return res.status(401).json({ error: 'invalid 2FA code' });
  }

  const token = `jwt.${Buffer.from(JSON.stringify({ sub: 'admin', role: 'superadmin', exp: Date.now() + 3600000 })).toString('base64url')}`;

  return res.json({
    token,
    refreshToken: 'refresh.demo.token',
    user: { id: 'admin-1', username: 'admin', role: 'superadmin', twoFactorEnabled: true },
    expiresIn: 3600
  });
});

app.get('/api/v1/servers', (req, res) => {
  res.json({ data: serverList, total: serverList.length });
});

app.get('/api/v1/servers/:id', (req, res) => {
  const server = serverList.find((item) => item.id === req.params.id);
  if (!server) {
    return res.status(404).json({ error: 'server not found' });
  }
  return res.json({ data: server });
});

app.get('/api/v1/vpn/regions', (req, res) => {
  res.json({ data: regionList, total: regionList.length });
});

app.post('/api/v1/vpn/connect', (req, res) => {
  const { region, userId = 'demo-user', deviceId = 'android-1' } = req.body || {};
  const targetRegion = region ? regionList.find((r) => r.id === region || r.name === region) : regionList[0];

  if (!targetRegion) {
    return res.status(400).json({ error: 'region not found' });
  }

  return res.json({
    success: true,
    userId,
    deviceId,
    region: targetRegion,
    vpnConfigUrl: `wg://securenet/${deviceId}?region=${targetRegion.id}`,
    status: 'connected',
    message: 'Conexão VPN iniciada com sucesso.'
  });
});

app.post('/api/v1/vpn/disconnect', (req, res) => {
  const { userId = 'demo-user', deviceId = 'android-1' } = req.body || {};
  res.json({ success: true, userId, deviceId, status: 'disconnected' });
});

app.get('/api/v1/dns', (req, res) => {
  res.json({
    data: {
      primary: 'dns.securenet.com',
      api: 'api.securenet.com',
      vpn: 'vpn.securenet.com',
      secure: true,
      cacheEnabled: true,
      blockedDomains: 18420,
      allowedDomains: 342,
      logsEnabled: true,
      mode: 'adblock + malware protection'
    }
  });
});

app.post('/api/v1/dns/records', (req, res) => {
  const { name, type, value, ttl = 300 } = req.body || {};
  if (!name || !type || !value) {
    return res.status(400).json({ error: 'name, type and value are required' });
  }
  return res.status(201).json({
    success: true,
    data: { id: 'dns-1', name, type, value, ttl, createdAt: new Date().toISOString() }
  });
});

app.post('/api/v1/security/scan', (req, res) => {
  const { filename = 'app.apk', sha256 = 'abc123', permissions = ['READ_EXTERNAL_STORAGE', 'ACCESS_NETWORK_STATE'] } = req.body || {};

  const riskScore = permissions.length > 3 ? 'dangerous' : 'safe';
  const result = riskScore === 'dangerous'
    ? {
        status: 'dangerous',
        label: '🔴 Aplicativo perigoso',
        threatsFound: 3,
        summary: 'O APK exibe permissões sensíveis e indicadores de risco ao banco de ameaças.'
      }
    : {
        status: 'safe',
        label: '🟢 Aplicativo aparentemente seguro',
        threatsFound: 0,
        summary: 'Sem indicadores conhecidos de malware e permissões críticas fora do padrão.'
      };

  return res.json({
    success: true,
    reportId: 'scan-1001',
    file: { filename, sha256, size: '24.8 MB', version: '2.4.1' },
    risk: result,
    permissions,
    recommendedAction: riskScore === 'dangerous' ? 'quarantine' : 'allow'
  });
});

app.get('/api/v1/security/report/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'completed',
    risk: 'warning',
    summary: 'Ameaças encontradas: 2',
    feed: threatFeeds,
    logs: auditLogs
  });
});

app.get('/api/v1/network/speed', (req, res) => {
  res.json({
    download: 178.4,
    upload: 65.2,
    unit: 'Mbps',
    latency: 18,
    stability: 'high'
  });
});

app.get('/api/v1/network/ping', (req, res) => {
  res.json({
    region: 'Brasil',
    ping: 18,
    loss: 0.2,
    status: 'good'
  });
});

app.get('/api/v1/api-keys', (req, res) => {
  res.json({
    data: [
      { id: 'key_dev_01', name: 'Development', permissions: ['read','write'], createdAt: '2026-08-17T00:00:00Z', expiresAt: null, revoked: false },
      { id: 'key_prod_01', name: 'Production', permissions: ['read','write','admin'], createdAt: '2026-08-17T00:00:00Z', expiresAt: '2027-08-17T00:00:00Z', revoked: false }
    ]
  });
});

app.post('/api/v1/api-keys', (req, res) => {
  const { name, permissions = ['read'], expiresAt = null, allowedIps = [] } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const secret = 'SK_live_demo_' + Math.random().toString(36).slice(2, 12);
  return res.status(201).json({
    success: true,
    data: {
      id: 'key_' + Math.random().toString(36).slice(2, 9),
      name,
      keyHash: mockApiKeyHash,
      key: secret,
      permissions,
      expiresAt,
      allowedIps,
      createdAt: new Date().toISOString(),
      lastAccessAt: null,
      revoked: false
    }
  });
});

app.get('/api/v1/admin/overview', (req, res) => {
  res.json({
    vps: appStatus,
    servers: serverList,
    regions: regionList,
    threats: threatFeeds,
    auditLogs,
    status: 'healthy'
  });
});

app.get('/webhooks/security', (req, res) => {
  res.json({ status: 'webhook registered', type: 'security' });
});

app.post('/webhooks/security', (req, res) => {
  const payload = req.body || {};
  res.status(202).json({ accepted: true, type: 'security', event: payload.event || 'threat_detected' });
});

app.post('/webhooks/vpn', (req, res) => {
  const payload = req.body || {};
  res.status(202).json({ accepted: true, type: 'vpn', event: payload.event || 'user_connected' });
});

app.post('/webhooks/server', (req, res) => {
  const payload = req.body || {};
  res.status(202).json({ accepted: true, type: 'server', event: payload.event || 'server_offline' });
});

app.get('/docs', (req, res) => {
  const swaggerHtml = readFileSync(path.join(__dirname, 'public', 'swagger', 'swagger-ui.html'), 'utf8');
  res.type('html').send(swaggerHtml);
});

app.get('/openapi.json', (req, res) => {
  const openapi = {
    openapi: '3.0.3',
    info: {
      title: 'SecureNet VPN API',
      version: '1.0.0',
      description: 'API REST para painel administrativo, VPN, DNS, segurança e monitoramento da plataforma SecureNet.'
    },
    servers: [{ url: 'https://api.securenet.com', description: 'Production' }],
    security: [{ bearerAuth: [], apiKeyAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    paths: {
      '/api/v1/auth/login': {
        post: {
          summary: 'Login administrativo',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/servers': {
        get: {
          summary: 'Listar servidores',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/vpn/regions': {
        get: {
          summary: 'Listar regiões',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/v1/security/scan': {
        post: {
          summary: 'Escanear APK',
          responses: { '200': { description: 'OK' } }
        }
      }
    }
  };
  res.json(openapi);
});

app.get('/swagger', (req, res) => {
  res.redirect('/docs');
});

app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/admin/', express.static(path.join(__dirname, 'public', 'admin')));

app.use((req, res) => {
  const normalizedUrl = normalizeEndpointPath(req.originalUrl || req.url || '/');
  res.status(404).json({ error: 'Not found', path: normalizedUrl });
});

app.listen(PORT, HOST, () => {
  console.log(`SecureNet platform running on http://${HOST}:${PORT}`);
  console.log(`Admin UI: http://${HOST}:${PORT}/admin`);
  console.log(`Swagger docs: http://${HOST}:${PORT}/docs`);
});
