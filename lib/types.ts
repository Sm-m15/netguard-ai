export type Role = 'Admin' | 'Analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  lastActive: string;
}

export type Protocol = 'TCP' | 'UDP' | 'MQTT' | 'HTTP' | 'CoAP' | 'Modbus' | 'ICMP';

export type AttackCategory =
  | 'Normal'
  | 'Network Scanning'
  | 'Flood / DoS'
  | 'Brute Force'
  | 'Botnet / DDoS'
  | 'MITM / Spoofing'
  | 'MQTT Suspicious Activity'
  | 'IoT Device Attack';

export type AttackLabel =
  | 'Normal'
  | 'Network Scanning'
  | 'SSH Brute Force (Hydra)'
  | 'HTTP Flood'
  | 'SYN Flood'
  | 'UDP Flood'
  | 'Slowloris'
  | 'Simulated Botnet DDoS'
  | 'ARP Spoofing (MITM)'
  | 'MQTT DoS'
  | 'MQTT Spoofing'
  | 'MQTT Brute Force'
  | 'MQTT Sniffing'
  | 'MQTT Malformed Packets'
  | 'Combined Tapo C200 Camera Attack';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertStatus = 'New' | 'Investigating' | 'Resolved';

export interface Flow {
  id: string;
  timestamp: string;
  srcIP: string;
  srcPort: number;
  destIP: string;
  destPort: number;
  protocol: Protocol;
  service: string;
  duration: number;
  srcBytes: number;
  destBytes: number;
  srcPackets: number;
  destPackets: number;
  connState: string;
  riskScore: number;
  predictedLabel: AttackLabel;
  attackCategory: AttackCategory;
  isAttack: boolean;
  anomalyScore: number;
  mqtt?: {
    type?: string;
    topic?: string;
    qos?: number;
    retain?: boolean;
  };
  http?: {
    method?: string;
    uri?: string;
    statusCode?: number;
    userAgent?: string;
  };
  dns?: {
    query?: string;
    rcode?: string;
  };
  ssh?: {
    version?: string;
    authSuccess?: boolean;
    attempts?: number;
  };
  ssl?: {
    version?: string;
    cipher?: string;
    subject?: string;
  };
  zeekLog: string;
  device?: string;
  environment?: string;
}

export interface Prediction {
  id: string;
  flowId: string;
  timestamp: string;
  riskScore: number;
  confidence: number;
  anomalyScore: number;
  predictedCategory: AttackCategory;
  predictedLabel: AttackLabel;
  probabilities: { category: AttackCategory; probability: number }[];
  isAttack: boolean;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: Severity;
  riskScore: number;
  predictedCategory: AttackCategory;
  predictedLabel: AttackLabel;
  status: AlertStatus;
  assignedTo: string;
  sourceIP: string;
  destIP: string;
  protocol: Protocol;
  description: string;
  evidence: { label: string; value: string }[];
  recommendations: string[];
  notes: { id: string; author: string; timestamp: string; content: string }[];
}

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  direction: 'positive' | 'negative';
}

export interface Explanation {
  predictionId: string;
  flowId: string;
  timestamp: string;
  predictedCategory: AttackCategory;
  riskScore: number;
  confidence: number;
  baseValue: number;
  contributions: FeatureContribution[];
  plainEnglish: string;
  modelVersion: string;
  limitations: string[];
}

export interface ModelVersion {
  id: string;
  version: string;
  name: string;
  dataset: string;
  isActive: boolean;
  lastTrained: string;
  precision: number;
  recall: number;
  f1: number;
  prAuc: number;
  far: number;
  columns: number;
  records: string;
  features: number;
  status: 'active' | 'archived';
}

export interface DashboardSummary {
  totalFlows: number;
  totalPackets: number;
  suspiciousPercent: number;
  riskScore: number;
  riskTrend: { time: string; risk: number; forecast: number | null }[];
  trafficVolume: { time: string; normal: number; suspicious: number }[];
  categoryDistribution: { category: AttackCategory; count: number; percent: number }[];
  recentAlerts: Alert[];
  modelStatus: ModelVersion;
  lastUpdate: string;
  topSourceIPs: { ip: string; flows: number; attacks: number }[];
}

export interface ForecastResult {
  horizon: number;
  riskScore: number;
  riskLevel: Severity;
  confidence: number;
  riskTimeline: { time: string; historical: number | null; forecast: number | null }[];
  categoryProbabilities: { category: AttackCategory; probability: number }[];
  anomalyTimeline: { time: string; score: number; flagged: boolean }[];
  baselineComparison: { metric: string; current: number; baseline: number; delta: number }[];
}

export interface TrafficFilters {
  search?: string;
  protocol?: Protocol | 'all';
  srcIP?: string;
  destIP?: string;
  riskLevel?: Severity | 'all';
  category?: AttackCategory | 'all';
  timeRange?: '1h' | '6h' | '24h' | '7d' | 'all';
}

export interface AlertFilters {
  severity?: Severity | 'all';
  category?: AttackCategory | 'all';
  status?: AlertStatus | 'all';
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all';
}

export interface ValidationSummary {
  rows: number;
  columns: number;
  missingValues: number;
  duplicates: number;
  invalidValues: number;
  detectedColumns: string[];
  missingRequired: string[];
  optionalPresent: string[];
  status: 'pass' | 'warn' | 'fail';
  preview: Record<string, string>[];
  protocolDistribution: { protocol: string; count: number }[];
  labelDistribution: { label: AttackLabel; count: number }[];
  sampleSize: number;
  totalEstimated?: number;
}

export interface ReportData {
  range: string;
  period: { start: string; end: string };
  attackSummary: { category: AttackCategory; count: number; percent: number; avgRisk: number }[];
  riskTrend: { date: string; avgRisk: number; maxRisk: number; attacks: number }[];
  topHosts: { ip: string; alerts: number; flows: number; topCategory: AttackCategory }[];
  modelMetrics: {
    precision: number;
    recall: number;
    f1: number;
    prAuc: number;
    far: number;
    accuracy: number;
  };
  totalAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  totalFlowsAnalyzed: number;
}

export interface Settings {
  alertThresholds: { medium: number; high: number; critical: number };
  notifications: { email: boolean; inApp: boolean; slack: boolean };
  modelId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
}

export interface DatasetInfo {
  name: string;
  version: string;
  records: string;
  columns: number;
  normalPercent: number;
  attackPercent: number;
  protocols: string[];
  attackLabels: { label: AttackLabel; category: AttackCategory }[];
  collectionPeriod: string;
  environments: string[];
  devices: string[];
  logSources: string[];
  labelNote: string;
}

export const DATASET_INFO: DatasetInfo = {
  name: 'IoT-SFC v2',
  version: '2026',
  records: '~49.9 million',
  columns: 88,
  normalPercent: 81.44,
  attackPercent: 18.56,
  protocols: ['MQTT', 'HTTP', 'CoAP', 'Modbus', 'TCP', 'UDP', 'Wi-Fi'],
  attackLabels: [
    { label: 'Normal', category: 'Normal' },
    { label: 'Network Scanning', category: 'Network Scanning' },
    { label: 'SSH Brute Force (Hydra)', category: 'Brute Force' },
    { label: 'HTTP Flood', category: 'Flood / DoS' },
    { label: 'SYN Flood', category: 'Flood / DoS' },
    { label: 'UDP Flood', category: 'Flood / DoS' },
    { label: 'Slowloris', category: 'Flood / DoS' },
    { label: 'MQTT DoS', category: 'Flood / DoS' },
    { label: 'Simulated Botnet DDoS', category: 'Botnet / DDoS' },
    { label: 'ARP Spoofing (MITM)', category: 'MITM / Spoofing' },
    { label: 'MQTT Spoofing', category: 'MITM / Spoofing' },
    { label: 'MQTT Brute Force', category: 'Brute Force' },
    { label: 'MQTT Sniffing', category: 'MQTT Suspicious Activity' },
    { label: 'MQTT Malformed Packets', category: 'MQTT Suspicious Activity' },
    { label: 'Combined Tapo C200 Camera Attack', category: 'IoT Device Attack' },
  ],
  collectionPeriod: '3–17 April 2025',
  environments: ['Smart Agriculture', 'Smart Manufacturing', 'Video Surveillance'],
  devices: [
    'ESP32 smart farming nodes',
    'Soil/moisture sensors',
    'Water pump actuators',
    'TP-Link Tapo C200 network camera',
    'Modbus industrial PLC simulation',
  ],
  logSources: ['conn.log', 'dns.log', 'http.log', 'ssl.log', 'ssh.log', 'mqtt.log', 'weird.log', 'notice.log', 'files.log'],
  labelNote:
    'Attack labels are used for model training and evaluation only. They are never used as input features during inference.',
};

export const ATTACK_LABEL_TO_CATEGORY: Record<AttackLabel, AttackCategory> = {
  Normal: 'Normal',
  'Network Scanning': 'Network Scanning',
  'SSH Brute Force (Hydra)': 'Brute Force',
  'HTTP Flood': 'Flood / DoS',
  'SYN Flood': 'Flood / DoS',
  'UDP Flood': 'Flood / DoS',
  Slowloris: 'Flood / DoS',
  'MQTT DoS': 'Flood / DoS',
  'Simulated Botnet DDoS': 'Botnet / DDoS',
  'ARP Spoofing (MITM)': 'MITM / Spoofing',
  'MQTT Spoofing': 'MITM / Spoofing',
  'MQTT Brute Force': 'Brute Force',
  'MQTT Sniffing': 'MQTT Suspicious Activity',
  'MQTT Malformed Packets': 'MQTT Suspicious Activity',
  'Combined Tapo C200 Camera Attack': 'IoT Device Attack',
};

export const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; dot: string; hex: string }> = {
  Low: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', dot: 'bg-emerald-500', hex: '#10b981' },
  Medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-500', dot: 'bg-yellow-500', hex: '#eab308' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-500', dot: 'bg-orange-500', hex: '#f97316' },
  Critical: { bg: 'bg-red-500/15', text: 'text-red-500', dot: 'bg-red-500', hex: '#ef4444' },
};

export const CATEGORY_COLORS: Record<AttackCategory, string> = {
  Normal: '#10b981',
  'Network Scanning': '#06b6d4',
  'Flood / DoS': '#f97316',
  'Brute Force': '#eab308',
  'Botnet / DDoS': '#ef4444',
  'MITM / Spoofing': '#a855f7',
  'MQTT Suspicious Activity': '#3b82f6',
  'IoT Device Attack': '#ec4899',
};
