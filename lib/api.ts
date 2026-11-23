import {
  type Flow,
  type Prediction,
  type Alert,
  type Explanation,
  type ModelVersion,
  type DashboardSummary,
  type ForecastResult,
  type TrafficFilters,
  type AlertFilters,
  type ValidationSummary,
  type ReportData,
  type Settings,
  type AuditLog,
  type User,
  type Protocol,
  type AttackLabel,
  type AttackCategory,
  type Severity,
  type AlertStatus,
  ATTACK_LABEL_TO_CATEGORY,
  DATASET_INFO,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function rand(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  const frac = x - Math.floor(x);
  return Math.round(min + frac * (max - min));
}

function randFloat(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  const frac = x - Math.floor(x);
  return +(min + frac * (max - min)).toFixed(2);
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SRC_IPS = [
  '192.168.1.10', '192.168.1.20', '192.168.1.30', '192.168.1.50',
  '192.168.1.100', '192.168.1.105', '192.168.2.10', '192.168.2.15',
  '10.0.0.12', '10.0.0.20', '10.0.0.33', '10.0.1.5',
  '192.168.10.4', '192.168.10.8', '192.168.20.1',
];

const DEST_IPS = [
  '192.168.1.1', '192.168.1.254', '10.0.0.1', '10.0.0.5',
  '192.168.2.1', '192.168.10.1', '192.168.20.5',
  '192.168.1.200', '10.0.1.10', '192.168.50.100',
];

const DEVICES = [
  'ESP32-Farm-01', 'ESP32-Farm-02', 'SoilSensor-03', 'WaterPump-Actuator',
  'TapoCam-C200', 'Modbus-PLC-Sim', 'TempSensor-04', 'Gateway-Edge-01',
  'FogNode-02', 'CloudAPI-01',
];

const ENVIRONMENTS = ['Smart Agriculture', 'Smart Manufacturing', 'Video Surveillance'];

const PROTOCOLS: Protocol[] = ['UDP', 'TCP', 'MQTT', 'HTTP', 'CoAP', 'Modbus'];

const ATTACK_LABELS: AttackLabel[] = [
  'Normal', 'Network Scanning', 'SSH Brute Force (Hydra)', 'HTTP Flood',
  'SYN Flood', 'UDP Flood', 'Slowloris', 'MQTT DoS',
  'Simulated Botnet DDoS', 'ARP Spoofing (MITM)', 'MQTT Spoofing',
  'MQTT Brute Force', 'MQTT Sniffing', 'MQTT Malformed Packets',
  'Combined Tapo C200 Camera Attack',
];

const SERVICES = ['mqtt', 'http', 'dns', 'ssh', 'ssl', 'modbus', '-', 'coap'];

const CONN_STATES = ['SF', 'S0', 'REJ', 'S1', 'S2', 'SH', 'RSTO', 'OTH'];

const ZEEK_LOGS = ['conn.log', 'dns.log', 'http.log', 'ssl.log', 'ssh.log', 'mqtt.log', 'weird.log', 'notice.log'];

const USERS: User[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah.chen@netguard.ai', role: 'Admin', lastActive: '2 min ago' },
  { id: 'u2', name: 'Marcus Reid', email: 'marcus.reid@netguard.ai', role: 'Analyst', lastActive: '5 min ago' },
  { id: 'u3', name: 'Elena Vasquez', email: 'elena.v@netguard.ai', role: 'Analyst', lastActive: '1 hour ago' },
  { id: 'u4', name: 'David Park', email: 'david.park@netguard.ai', role: 'Admin', lastActive: '3 hours ago' },
  { id: 'u5', name: 'Aisha Khan', email: 'aisha.khan@netguard.ai', role: 'Analyst', lastActive: '1 day ago' },
];

const MODEL_VERSIONS: ModelVersion[] = [
  {
    id: 'mv1', version: 'v2.3.1', name: 'NetGuard-XGBoost', dataset: 'IoT-SFC v2 (2026)',
    isActive: true, lastTrained: '2026-11-20T08:00:00Z',
    precision: 0.962, recall: 0.941, f1: 0.951, prAuc: 0.968, far: 0.018,
    columns: 88, records: '~49.9M', features: 42, status: 'active',
  },
  {
    id: 'mv2', version: 'v2.2.0', name: 'NetGuard-XGBoost', dataset: 'IoT-SFC v2 (2026)',
    isActive: false, lastTrained: '2026-10-15T08:00:00Z',
    precision: 0.948, recall: 0.929, f1: 0.938, prAuc: 0.955, far: 0.024,
    columns: 84, records: '~47.2M', features: 38, status: 'archived',
  },
  {
    id: 'mv3', version: 'v2.1.0', name: 'NetGuard-RF', dataset: 'IoT-SFC v2 (2026)',
    isActive: false, lastTrained: '2026-09-01T08:00:00Z',
    precision: 0.931, recall: 0.917, f1: 0.924, prAuc: 0.941, far: 0.031,
    columns: 84, records: '~45.0M', features: 35, status: 'archived',
  },
  {
    id: 'mv4', version: 'v2.0.0', name: 'NetGuard-LGBM', dataset: 'IoT-SFC v2 (2025)',
    isActive: false, lastTrained: '2026-06-10T08:00:00Z',
    precision: 0.918, recall: 0.902, f1: 0.910, prAuc: 0.926, far: 0.039,
    columns: 80, records: '~40.1M', features: 32, status: 'archived',
  },
];

const AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', timestamp: '2026-11-22T10:35:00Z', user: 'Sarah Chen', action: 'Resolved Alert', resource: 'ALT-2026-1042', details: 'Marked as resolved with note' },
  { id: 'a2', timestamp: '2026-11-22T10:12:00Z', user: 'Marcus Reid', action: 'Updated Alert Status', resource: 'ALT-2026-1039', details: 'New → Investigigating' },
  { id: 'a3', timestamp: '2026-11-22T09:48:00Z', user: 'Sarah Chen', action: 'Saved Settings', resource: 'Alert Thresholds', details: 'Critical cutoff changed to 85' },
  { id: 'a4', timestamp: '2026-11-22T09:20:00Z', user: 'Elena Vasquez', action: 'Uploaded CSV', resource: 'traffic_batch_2026.csv', details: '12,450 rows validated' },
  { id: 'a5', timestamp: '2026-11-22T08:55:00Z', user: 'David Park', action: 'Set Active Model', resource: 'NetGuard-XGBoost v2.3.1', details: 'Activated model version' },
  { id: 'a6', timestamp: '2026-11-21T17:30:00Z', user: 'Sarah Chen', action: 'Deleted Alert', resource: 'ALT-2026-0998', details: 'Duplicate alert removed' },
  { id: 'a7', timestamp: '2026-11-21T16:10:00Z', user: 'Marcus Reid', action: 'Generated Report', resource: 'Weekly Report', details: 'Exported as PDF' },
  { id: 'a8', timestamp: '2026-11-21T14:22:00Z', user: 'Aisha Khan', action: 'Added Note', resource: 'ALT-2026-1031', details: 'Investigation note added' },
  { id: 'a9', timestamp: '2026-11-21T11:05:00Z', user: 'Sarah Chen', action: 'Updated User Role', resource: 'Elena Vasquez', details: 'Analyst → Analyst (confirmed)' },
  { id: 'a10', timestamp: '2026-11-21T09:15:00Z', user: 'David Park', action: 'Login', resource: 'Auth', details: 'Admin session started' },
];

// ─── Flow Generation ────────────────────────────────────────────────────────

function generateFlows(count: number): Flow[] {
  const flows: Flow[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const seed = i + 1;
    const isAttack = randFloat(seed, 0, 100) < 19;
    const label = isAttack
      ? pick(ATTACK_LABELS.slice(1), rand(seed, 0, ATTACK_LABELS.length - 1))
      : 'Normal';
    const category = ATTACK_LABEL_TO_CATEGORY[label];
    const protocol = isAttack
      ? pick(PROTOCOLS, rand(seed * 3, 0, PROTOCOLS.length))
      : pick<Protocol>(['UDP', 'UDP', 'TCP', 'TCP', 'MQTT', 'HTTP', 'CoAP'], rand(seed, 0, 7));

    const srcIP = pick(SRC_IPS, rand(seed * 7, 0, SRC_IPS.length));
    const destIP = pick(DEST_IPS, rand(seed * 11, 0, DEST_IPS.length));
    const ts = new Date(now - rand(seed, 0, 86400000) * 1000).toISOString();

    const riskScore = isAttack ? rand(seed, 45, 98) : rand(seed, 0, 35);
    const duration = isAttack ? randFloat(seed, 0.01, 120) : randFloat(seed, 0.5, 600);
    const srcBytes = isAttack ? rand(seed, 40, 50000) : rand(seed, 80, 5000);
    const destBytes = isAttack ? rand(seed, 0, 30000) : rand(seed, 100, 20000);
    const srcPackets = isAttack ? rand(seed, 1, 5000) : rand(seed, 1, 200);
    const destPackets = isAttack ? rand(seed, 0, 2000) : rand(seed, 1, 150);

    const flow: Flow = {
      id: `flow-${String(i + 1).padStart(6, '0')}`,
      timestamp: ts,
      srcIP,
      srcPort: rand(seed * 13, 1024, 65535),
      destIP,
      destPort: pick([1883, 80, 443, 22, 53, 502, 5683, 8080, 8883], rand(seed * 17, 0, 9)),
      protocol,
      service: pick(SERVICES, rand(seed * 19, 0, SERVICES.length)),
      duration,
      srcBytes,
      destBytes,
      srcPackets,
      destPackets,
      connState: isAttack ? pick(['S0', 'REJ', 'RSTO', 'SH'], rand(seed * 23, 0, 4)) : pick(['SF', 'SF', 'SF', 'S1'], rand(seed * 29, 0, 4)),
      riskScore,
      predictedLabel: label,
      attackCategory: category,
      isAttack,
      anomalyScore: isAttack ? randFloat(seed, 0.6, 0.99) : randFloat(seed, 0, 0.4),
      zeekLog: pick(ZEEK_LOGS, rand(seed * 31, 0, ZEEK_LOGS.length)),
      device: pick(DEVICES, rand(seed * 37, 0, DEVICES.length)),
      environment: pick(ENVIRONMENTS, rand(seed * 41, 0, ENVIRONMENTS.length)),
    };

    // Protocol-specific fields
    if (protocol === 'MQTT') {
      flow.mqtt = {
        type: pick(['publish', 'subscribe', 'connect', 'pingreq'], rand(seed * 43, 0, 4)),
        topic: pick(['/farm/sensor/soil', '/farm/actuator/pump', '/manufacturing/temp', '/camera/motion', '/farm/sensor/humidity'], rand(seed * 47, 0, 5)),
        qos: pick([0, 0, 1, 2], rand(seed * 53, 0, 4)),
        retain: rand(seed * 59, 0, 2) === 0,
      };
      if (label === 'MQTT DoS') flow.mqtt.type = 'connect';
    }
    if (protocol === 'HTTP') {
      flow.http = {
        method: pick(['GET', 'POST', 'GET', 'PUT'], rand(seed * 61, 0, 4)),
        uri: pick(['/api/status', '/api/data', '/camera/stream', '/login', '/firmware'], rand(seed * 67, 0, 5)),
        statusCode: isAttack ? pick([200, 401, 403, 500, 503], rand(seed * 71, 0, 5)) : pick([200, 200, 200, 304], rand(seed * 73, 0, 4)),
        userAgent: pick(['ESP32-HTTPClient/2.0', 'curl/7.68', 'Mozilla/5.0', 'TapoCam/1.1'], rand(seed * 79, 0, 4)),
      };
    }
    if (rand(seed * 83, 0, 3) === 0) {
      flow.dns = {
        query: pick(['farm.local', 'mqtt-broker.local', 'cloud-api.netguard.ai', 'ntp.org', 'update.tapo.com'], rand(seed * 89, 0, 5)),
        rcode: pick(['NOERROR', 'NOERROR', 'NXDOMAIN'], rand(seed * 97, 0, 3)),
      };
    }
    if (protocol === 'TCP' && rand(seed * 101, 0, 3) === 0) {
      flow.ssh = {
        version: pick(['SSH-2.0-OpenSSH_8.2', 'SSH-2.0-libssh2', 'SSH-1.99'], rand(seed * 103, 0, 3)),
        authSuccess: !isAttack,
        attempts: isAttack ? rand(seed, 5, 50) : 1,
      };
    }
    if (rand(seed * 107, 0, 4) === 0) {
      flow.ssl = {
        version: pick(['TLSv1.2', 'TLSv1.3', 'TLSv1.1'], rand(seed * 109, 0, 3)),
        cipher: pick(['AES256-GCM-SHA384', 'ECDHE-RSA-AES128-GCM-SHA256', 'CHACHA20-POLY1305'], rand(seed * 113, 0, 3)),
        subject: pick(['*.netguard.ai', 'mqtt-broker.local', 'cloud-api.netguard.ai'], rand(seed * 127, 0, 3)),
      };
    }

    flows.push(flow);
  }
  return flows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

const ALL_FLOWS = generateFlows(240);

// ─── Alert Generation ───────────────────────────────────────────────────────

function generateAlerts(): Alert[] {
  const attackFlows = ALL_FLOWS.filter((f) => f.isAttack).slice(0, 28);
  const statuses: AlertStatus[] = ['New', 'Investigating', 'Resolved'];
  return attackFlows.map((flow, i) => {
    const severity: Severity =
      flow.riskScore >= 85 ? 'Critical' :
      flow.riskScore >= 65 ? 'High' :
      flow.riskScore >= 40 ? 'Medium' : 'Low';
    const status = pick(statuses, rand(i, 0, 3));
    const assignedTo = pick(USERS, rand(i * 3, 0, USERS.length)).name;
    return {
      id: `ALT-2026-${String(1042 - i).padStart(4, '0')}`,
      timestamp: flow.timestamp,
      severity,
      riskScore: flow.riskScore,
      predictedCategory: flow.attackCategory,
      predictedLabel: flow.predictedLabel,
      status,
      assignedTo,
      sourceIP: flow.srcIP,
      destIP: flow.destIP,
      protocol: flow.protocol,
      description: `${flow.predictedLabel} detected from ${flow.srcIP} targeting ${flow.destIP} via ${flow.protocol}`,
      evidence: [
        { label: 'Source IP', value: flow.srcIP },
        { label: 'Destination IP', value: flow.destIP },
        { label: 'Protocol', value: flow.protocol },
        { label: 'Service', value: flow.service },
        { label: 'Duration', value: `${flow.duration}s` },
        { label: 'Packets', value: `${flow.srcPackets + flow.destPackets}` },
        { label: 'Bytes', value: `${(flow.srcBytes + flow.destBytes).toLocaleString()}` },
        { label: 'Anomaly Score', value: flow.anomalyScore.toFixed(2) },
        { label: 'Zeek Log', value: flow.zeekLog },
        { label: 'Device', value: flow.device || '-' },
      ],
      recommendations: getRecommendations(flow.attackCategory),
      notes: status !== 'New' ? [
        {
          id: `note-${i}-1`,
          author: assignedTo,
          timestamp: new Date(new Date(flow.timestamp).getTime() + 600000).toISOString(),
          content: i % 2 === 0
            ? 'Initial investigation shows unusual traffic pattern from the source. Monitoring for recurrence.'
            : 'Correlated with other alerts from the same subnet. Escalating for review.',
        },
      ] : [],
    };
  });
}

function getRecommendations(category: AttackCategory): string[] {
  const recs: Record<AttackCategory, string[]> = {
    Normal: [],
    'Network Scanning': [
      'Block source IP at the firewall and review scan signatures',
      'Check for open ports on targeted hosts and disable unnecessary services',
      'Enable port-scan detection rules on the IDS',
    ],
    'Flood / DoS': [
      'Rate-limit traffic from the source IP immediately',
      'Review firewall rules and enable SYN cookies if SYN flood',
      'Check MQTT broker configuration if MQTT DoS and apply connection limits',
      'Monitor service availability for the targeted host',
    ],
    'Brute Force': [
      'Temporarily block source IP and review failed login logs',
      'Enforce account lockout policies and strengthen passwords',
      'Audit SSH credentials and rotate if compromise is suspected',
    ],
    'Botnet / DDoS': [
      'Activate DDoS mitigation and engage upstream filtering',
      'Isolate affected IoT devices and check for compromise indicators',
      'Review network segmentation to contain the botnet spread',
    ],
    'MITM / Spoofing': [
      'Inspect ARP tables on affected switches for spoofed entries',
      'Enable DHCP snooping and dynamic ARP inspection',
      'Verify MQTT broker certificate and topic ACLs',
    ],
    'MQTT Suspicious Activity': [
      'Inspect MQTT broker logs for unauthorized subscriptions',
      'Review topic ACLs and enforce client authentication',
      'Monitor for malformed packet floods and adjust broker limits',
    ],
    'IoT Device Attack': [
      'Isolate the Tapo C200 camera and review its firmware',
      'Check camera RTSP/ONVIF settings and disable unused services',
      'Audit all traffic to the camera and apply network segmentation',
    ],
  };
  return recs[category];
}

const ALL_ALERTS = generateAlerts();

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = Date.now();
  const points = 24;
  const riskTrend = Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * 3600000);
    const base = 25 + Math.sin(i / 3) * 10;
    const spike = i === 8 ? 35 : i === 15 ? 28 : 0;
    const risk = Math.min(100, Math.max(0, Math.round(base + spike + randFloat(i, -5, 5))));
    return {
      time: t.toISOString(),
      risk,
      forecast: i >= points - 5 ? Math.min(100, risk + randFloat(i, 0, 15)) : null,
    };
  });

  const trafficVolume = Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * 3600000);
    const isAttack = i === 8 || i === 15;
    return {
      time: t.toISOString(),
      normal: rand(i * 2, 800, 1400),
      suspicious: isAttack ? rand(i, 200, 450) : rand(i * 3, 20, 90),
    };
  });

  const categoryCounts: Record<AttackCategory, number> = {
    Normal: 0, 'Network Scanning': 0, 'Flood / DoS': 0, 'Brute Force': 0,
    'Botnet / DDoS': 0, 'MITM / Spoofing': 0, 'MQTT Suspicious Activity': 0,
    'IoT Device Attack': 0,
  };
  ALL_FLOWS.forEach((f) => { categoryCounts[f.attackCategory]++; });
  const total = ALL_FLOWS.length;
  const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
    category: category as AttackCategory,
    count,
    percent: +((count / total) * 100).toFixed(1),
  }));

  const totalPackets = ALL_FLOWS.reduce((s, f) => s + f.srcPackets + f.destPackets, 0);
  const suspiciousCount = ALL_FLOWS.filter((f) => f.isAttack).length;

  const topSourceIPs = Object.entries(
    ALL_FLOWS.reduce((acc, f) => {
      if (!acc[f.srcIP]) acc[f.srcIP] = { flows: 0, attacks: 0 };
      acc[f.srcIP].flows++;
      if (f.isAttack) acc[f.srcIP].attacks++;
      return acc;
    }, {} as Record<string, { flows: number; attacks: number }>)
  )
    .map(([ip, v]) => ({ ip, ...v }))
    .sort((a, b) => b.attacks - a.attacks)
    .slice(0, 5);

  return {
    totalFlows: 4_987_234,
    totalPackets,
    suspiciousPercent: +((suspiciousCount / total) * 100).toFixed(1),
    riskScore: riskTrend[riskTrend.length - 1].risk,
    riskTrend,
    trafficVolume,
    categoryDistribution,
    recentAlerts: ALL_ALERTS.slice(0, 6),
    modelStatus: MODEL_VERSIONS[0],
    lastUpdate: new Date().toISOString(),
    topSourceIPs,
  };
}

export async function getTrafficFlows(filters: TrafficFilters = {}): Promise<{ flows: Flow[]; total: number }> {
  let flows = [...ALL_FLOWS];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    flows = flows.filter((f) =>
      f.srcIP.includes(q) || f.destIP.includes(q) || f.protocol.toLowerCase().includes(q) ||
      f.service.toLowerCase().includes(q) || f.predictedLabel.toLowerCase().includes(q) ||
      f.attackCategory.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
    );
  }
  if (filters.protocol && filters.protocol !== 'all') {
    flows = flows.filter((f) => f.protocol === filters.protocol);
  }
  if (filters.srcIP) flows = flows.filter((f) => f.srcIP.includes(filters.srcIP!));
  if (filters.destIP) flows = flows.filter((f) => f.destIP.includes(filters.destIP!));
  if (filters.riskLevel && filters.riskLevel !== 'all') {
    flows = flows.filter((f) => {
      const sev: Severity = f.riskScore >= 85 ? 'Critical' : f.riskScore >= 65 ? 'High' : f.riskScore >= 40 ? 'Medium' : 'Low';
      return sev === filters.riskLevel;
    });
  }
  if (filters.category && filters.category !== 'all') {
    flows = flows.filter((f) => f.attackCategory === filters.category);
  }
  if (filters.timeRange && filters.timeRange !== 'all') {
    const hours = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 }[filters.timeRange];
    const cutoff = Date.now() - hours * 3600000;
    flows = flows.filter((f) => new Date(f.timestamp).getTime() > cutoff);
  }

  return { flows, total: flows.length };
}

export async function getFlowById(id: string): Promise<Flow | null> {
  return ALL_FLOWS.find((f) => f.id === id) || null;
}

export async function getTrafficStats(flows: Flow[]) {
  const protocolDist = Object.entries(
    flows.reduce((acc, f) => {
      acc[f.protocol] = (acc[f.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([protocol, count]) => ({ protocol, count }));

  const totalBytes = flows.reduce((s, f) => s + f.srcBytes + f.destBytes, 0);
  const totalPackets = flows.reduce((s, f) => s + f.srcPackets + f.destPackets, 0);
  return { protocolDist, totalBytes, totalPackets, avgDuration: flows.reduce((s, f) => s + f.duration, 0) / flows.length };
}

// ─── CSV Upload ─────────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  'timestamp', 'src_ip', 'dst_ip', 'src_port', 'dst_port',
  'protocol', 'service', 'duration', 'src_bytes', 'dst_bytes',
  'src_pkts', 'dst_pkts', 'conn_state', 'label',
];

const OPTIONAL_COLUMNS = [
  'mqtt_type', 'mqtt_topic', 'mqtt_qos', 'mqtt_retain',
  'http_method', 'http_uri', 'http_status_code', 'http_user_agent',
  'dns_query', 'dns_rcode', 'ssh_version', 'ssh_auth_success', 'ssh_attempts',
  'ssl_version', 'ssl_cipher', 'ssl_subject', 'zeek_log', 'device', 'environment',
];

export async function uploadCsv(file: File): Promise<ValidationSummary> {
  const text = await file.text();
  const lines = text.split('\n').filter((l) => l.trim());
  const headers = lines[0]?.split(',').map((h) => h.trim().toLowerCase()) || [];

  const detectedColumns = headers;
  const missingRequired = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  const optionalPresent = OPTIONAL_COLUMNS.filter((c) => headers.includes(c));

  const dataRows = lines.slice(1);
  const sampleSize = Math.min(dataRows.length, 50);
  const preview: Record<string, string>[] = [];
  for (let i = 0; i < sampleSize; i++) {
    const cells = dataRows[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    preview.push(row);
  }

  let missingValues = 0;
  let invalidValues = 0;
  dataRows.slice(0, Math.min(dataRows.length, 500)).forEach((line) => {
    const cells = line.split(',');
    headers.forEach((h, idx) => {
      const val = cells[idx]?.trim();
      if (!val || val === '' || val === '-') {
        if (REQUIRED_COLUMNS.includes(h)) missingValues++;
      }
      if ((h === 'src_port' || h === 'dst_port') && val && isNaN(Number(val))) invalidValues++;
    });
  });

  const duplicates = dataRows.length - new Set(dataRows.slice(0, 5000)).size;

  const protocolDistribution = preview.reduce((acc, row) => {
    const proto = row.protocol || 'unknown';
    acc[proto] = (acc[proto] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const protoDist = Object.entries(protocolDistribution).map(([protocol, count]) => ({ protocol, count }));

  const labelDist: Record<string, number> = {};
  preview.forEach((row) => {
    const label = (row.label || 'Normal') as AttackLabel;
    labelDist[label] = (labelDist[label] || 0) + 1;
  });
  const labelDistribution = Object.entries(labelDist).map(([label, count]) => ({ label: label as AttackLabel, count }));

  const status: 'pass' | 'warn' | 'fail' = missingRequired.length > 0 ? 'fail' : (missingValues > 5 || duplicates > 10 ? 'warn' : 'pass');

  return {
    rows: dataRows.length,
    columns: headers.length,
    missingValues,
    duplicates,
    invalidValues,
    detectedColumns,
    missingRequired,
    optionalPresent,
    status,
    preview,
    protocolDistribution: protoDist,
    labelDistribution,
    sampleSize,
    totalEstimated: dataRows.length,
  };
}

export const CSV_REQUIRED_COLUMNS = REQUIRED_COLUMNS;
export const CSV_OPTIONAL_COLUMNS = OPTIONAL_COLUMNS;

// ─── Forecast ───────────────────────────────────────────────────────────────

export async function getForecast(horizon: 5 | 15 | 30): Promise<ForecastResult> {
  const now = Date.now();
  const historicalPoints = 20;
  const forecastPoints = horizon <= 5 ? 5 : horizon <= 15 ? 8 : 12;

  const historical = Array.from({ length: historicalPoints }, (_, i) => {
    const t = new Date(now - (historicalPoints - i) * (horizon * 60000 / 2));
    const base = 30 + Math.sin(i / 3) * 12;
    const spike = i === 10 ? 30 : i === 14 ? 20 : 0;
    return { time: t.toISOString(), value: Math.min(100, Math.max(0, Math.round(base + spike))) };
  });

  const lastHist = historical[historical.length - 1].value;
  const forecastValues = Array.from({ length: forecastPoints }, (_, i) => {
    const t = new Date(now + (i + 1) * (horizon * 60000 / forecastPoints));
    const trend = i * (horizon > 10 ? 2.5 : 1.5);
    const noise = randFloat(i + 100, -5, 5);
    return { time: t.toISOString(), value: Math.min(100, Math.max(0, Math.round(lastHist + trend + noise))) };
  });

  const riskScore = forecastValues[forecastValues.length - 1].value;
  const riskLevel: Severity = riskScore >= 80 ? 'Critical' : riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';

  const riskTimeline = [
    ...historical.map((h) => ({ time: h.time, historical: h.value, forecast: null as number | null })),
    ...forecastValues.map((f) => ({ time: f.time, historical: null as number | null, forecast: f.value })),
  ];

  const categories: AttackCategory[] = ['Flood / DoS', 'Botnet / DDoS', 'Brute Force', 'Network Scanning', 'MITM / Spoofing', 'MQTT Suspicious Activity', 'IoT Device Attack'];
  const categoryProbabilities = categories.map((category, i) => ({
    category,
    probability: +Math.max(0.02, randFloat(i + 200, 0.05, 0.4) - (riskScore < 50 ? 0.15 : 0)).toFixed(3),
  })).sort((a, b) => b.probability - a.probability);

  const anomalyTimeline = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now - (24 - i) * 300000);
    const isAnomaly = i === 10 || i === 14 || i === 18;
    const score = isAnomaly ? randFloat(i, 0.75, 0.98) : randFloat(i, 0.05, 0.35);
    return { time: t.toISOString(), score, flagged: isAnomaly };
  });

  const baselineComparison = [
    { metric: 'Avg Packets/sec', current: 4520, baseline: 2100, delta: 115 },
    { metric: 'TCP SYN Rate', current: 890, baseline: 120, delta: 642 },
    { metric: 'MQTT Connect/s', current: 340, baseline: 45, delta: 656 },
    { metric: 'Unique Src IPs', current: 128, baseline: 320, delta: -60 },
    { metric: 'Flow Duration (avg)', current: 12, baseline: 85, delta: -86 },
  ];

  return {
    horizon,
    riskScore,
    riskLevel,
    confidence: +randFloat(horizon, 0.78, 0.95).toFixed(2),
    riskTimeline,
    categoryProbabilities,
    anomalyTimeline,
    baselineComparison,
  };
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function getAlerts(filters: AlertFilters = {}): Promise<Alert[]> {
  let alerts = [...ALL_ALERTS];
  if (filters.severity && filters.severity !== 'all') alerts = alerts.filter((a) => a.severity === filters.severity);
  if (filters.category && filters.category !== 'all') alerts = alerts.filter((a) => a.predictedCategory === filters.category);
  if (filters.status && filters.status !== 'all') alerts = alerts.filter((a) => a.status === filters.status);
  if (filters.timeRange && filters.timeRange !== 'all') {
    const hours = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 }[filters.timeRange];
    const cutoff = Date.now() - hours * 3600000;
    alerts = alerts.filter((a) => new Date(a.timestamp).getTime() > cutoff);
  }
  return alerts;
}

export async function getAlertById(id: string): Promise<Alert | null> {
  return ALL_ALERTS.find((a) => a.id === id) || null;
}

const alertMutations: Map<string, Partial<Alert>> = new Map();

export async function updateAlert(id: string, status: AlertStatus, note?: string): Promise<Alert> {
  const alert = ALL_ALERTS.find((a) => a.id === id);
  if (!alert) throw new Error('Alert not found');
  const existing = alertMutations.get(id) || {};
  const updatedNotes = note
    ? [...(existing.notes || alert.notes), {
        id: `note-${Date.now()}`,
        author: 'Sarah Chen',
        timestamp: new Date().toISOString(),
        content: note,
      }]
    : (existing.notes || alert.notes);
  const updated = { ...alert, ...existing, status, notes: updatedNotes };
  alertMutations.set(id, updated);
  return updated;
}

export async function deleteAlert(id: string): Promise<void> {
  const idx = ALL_ALERTS.findIndex((a) => a.id === id);
  if (idx >= 0) ALL_ALERTS.splice(idx, 1);
}

export async function addAlertNote(id: string, author: string, content: string): Promise<Alert> {
  const alert = ALL_ALERTS.find((a) => a.id === id);
  if (!alert) throw new Error('Alert not found');
  alert.notes.push({
    id: `note-${Date.now()}`,
    author,
    timestamp: new Date().toISOString(),
    content,
  });
  return alert;
}

// ─── Explain ────────────────────────────────────────────────────────────────

const EXPLANATION_FEATURES = [
  'Connection Rate', 'Packets/sec', 'SYN Flag Count', 'Flow Duration',
  'Inbound/Outbound Bytes Ratio', 'Connection State (S0)', 'MQTT Message Rate',
  'Unusual Service Activity', 'Protocol Anomaly Score', 'Source Port Entropy',
  'Destination Port (1883)', 'Packet Size Variance',
];

export async function getPredictions(): Promise<Prediction[]> {
  return ALL_FLOWS.filter((f) => f.isAttack).slice(0, 20).map((f, i) => ({
    id: `pred-${String(i + 1).padStart(4, '0')}`,
    flowId: f.id,
    timestamp: f.timestamp,
    riskScore: f.riskScore,
    confidence: +randFloat(i, 0.75, 0.97).toFixed(2),
    anomalyScore: f.anomalyScore,
    predictedCategory: f.attackCategory,
    predictedLabel: f.predictedLabel,
    probabilities: [
      { category: f.attackCategory, probability: +randFloat(i, 0.55, 0.92).toFixed(2) },
      { category: 'Flood / DoS', probability: +randFloat(i + 1, 0.02, 0.25).toFixed(2) },
      { category: 'Brute Force', probability: +randFloat(i + 2, 0.01, 0.15).toFixed(2) },
      { category: 'Normal', probability: +randFloat(i + 3, 0.01, 0.1).toFixed(2) },
    ],
    isAttack: true,
  }));
}

export async function getExplanation(predictionId: string): Promise<Explanation> {
  const predictions = await getPredictions();
  const pred = predictions.find((p) => p.id === predictionId) || predictions[0];

  const contributions = EXPLANATION_FEATURES.map((feature, i) => {
    const value = randFloat(i + predictionId.length, -1, 2);
    const contribution = randFloat(i + predictionId.length * 2, -0.35, 0.45);
    return {
      feature,
      value: +value.toFixed(2),
      contribution: +contribution.toFixed(3),
      direction: (contribution >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
    };
  }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    predictionId: pred.id,
    flowId: pred.flowId,
    timestamp: pred.timestamp,
    predictedCategory: pred.predictedCategory,
    riskScore: pred.riskScore,
    confidence: pred.confidence,
    baseValue: 0.18,
    contributions,
    plainEnglish: `The model classified this traffic flow as "${pred.predictedLabel}" with ${Math.round(pred.confidence * 100)}% confidence. The strongest contributing factors are ${contributions[0].feature.toLowerCase()} (${contributions[0].direction === 'positive' ? 'increased' : 'decreased'} risk) and ${contributions[1].feature.toLowerCase()}. The anomaly score of ${pred.anomalyScore.toFixed(2)} indicates ${pred.anomalyScore > 0.7 ? 'a significant deviation' : 'a moderate deviation'} from the normal traffic baseline established on the IoT-SFC v2 dataset. This prediction is a probability estimate, not a confirmed attack.`,
    modelVersion: 'NetGuard-XGBoost v2.3.1',
    limitations: [
      'Predictions are probability estimates based on historical patterns, not confirmed attacks.',
      'A high anomaly score may represent a legitimate traffic spike or new device onboarding.',
      'The model was trained on IoT-SFC v2 data collected 3–17 April 2025; novel attack patterns outside this period may be missed.',
      'Protocol-specific features can be sparse — missing MQTT/HTTP/SSH fields are normal for flows from other Zeek log types.',
      'Feature contributions are approximate (SHAP-style) and may not capture all non-linear interactions.',
    ],
  };
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function getReports(range: 'daily' | 'weekly' | 'custom', customStart?: string, customEnd?: string): Promise<ReportData> {
  const days = range === 'daily' ? 1 : range === 'weekly' ? 7 : 14;
  const now = Date.now();
  const startDate = customStart || new Date(now - days * 86400000).toISOString();
  const endDate = customEnd || new Date(now).toISOString();

  const riskTrend = Array.from({ length: days === 1 ? 24 : days }, (_, i) => {
    const date = new Date(now - (days === 1 ? 24 - i : days - i) * (days === 1 ? 3600000 : 86400000));
    const isAttack = i % 5 === 0;
    return {
      date: date.toISOString(),
      avgRisk: rand(i * 2, 20, 55) + (isAttack ? 25 : 0),
      maxRisk: rand(i * 3, 50, 90) + (isAttack ? 10 : 0),
      attacks: rand(i, isAttack ? 8 : 1, isAttack ? 35 : 12),
    };
  });

  const categories: AttackCategory[] = ['Network Scanning', 'Flood / DoS', 'Brute Force', 'Botnet / DDoS', 'MITM / Spoofing', 'MQTT Suspicious Activity', 'IoT Device Attack'];
  const totalAttacks = rand(100, 200, 500);
  const attackSummary = categories.map((category, i) => {
    const count = rand(i + 50, 5, 80);
    return {
      category,
      count,
      percent: +((count / totalAttacks) * 100).toFixed(1),
      avgRisk: rand(i + 200, 45, 88),
    };
  });

  const topHosts = SRC_IPS.slice(0, 6).map((ip, i) => ({
    ip,
    alerts: rand(i + 300, 2, 25),
    flows: rand(i + 400, 100, 2000),
    topCategory: pick(categories, rand(i + 500, 0, categories.length)),
  })).sort((a, b) => b.alerts - a.alerts);

  return {
    range,
    period: { start: startDate, end: endDate },
    attackSummary,
    riskTrend,
    topHosts,
    modelMetrics: {
      precision: 0.962, recall: 0.941, f1: 0.951, prAuc: 0.968, far: 0.018, accuracy: 0.957,
    },
    totalAlerts: totalAttacks,
    resolvedAlerts: Math.round(totalAttacks * 0.72),
    criticalAlerts: Math.round(totalAttacks * 0.15),
    totalFlowsAnalyzed: 4_987_234,
  };
}

// ─── Settings ───────────────────────────────────────────────────────────────

let currentSettings: Settings = {
  alertThresholds: { medium: 35, high: 65, critical: 85 },
  notifications: { email: true, inApp: true, slack: false },
  modelId: 'mv1',
};

export async function getSettings(): Promise<Settings> {
  return { ...currentSettings };
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  currentSettings = { ...currentSettings, ...settings, alertThresholds: { ...currentSettings.alertThresholds, ...(settings.alertThresholds || {}) }, notifications: { ...currentSettings.notifications, ...(settings.notifications || {}) } };
  return { ...currentSettings };
}

export async function getModelVersions(): Promise<ModelVersion[]> {
  return [...MODEL_VERSIONS];
}

export async function setActiveModel(modelId: string): Promise<ModelVersion> {
  const model = MODEL_VERSIONS.find((m) => m.id === modelId);
  if (!model) throw new Error('Model not found');
  MODEL_VERSIONS.forEach((m) => { m.isActive = m.id === modelId; m.status = m.id === modelId ? 'active' : 'archived'; });
  currentSettings.modelId = modelId;
  return model;
}

export async function getUsers(): Promise<User[]> {
  return [...USERS];
}

export async function updateUserRole(userId: string, role: 'Admin' | 'Analyst'): Promise<User> {
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');
  user.role = role;
  return user;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return [...AUDIT_LOGS];
}

export function getDatasetInfo() {
  return DATASET_INFO;
}
