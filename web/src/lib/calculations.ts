// S3T — Solution Sizing & Scoping Tool
// Calculation Engine (ported from original E3T by Dr Ming Chan Tok, 1 May 2026)

export interface RateCardItem {
  id?: string;
  project_id?: string;
  code: string;
  title: string;
  category: string;
  list_price: number;  // hourly list price (MYR)
  cost_price: number;  // hourly cost price (MYR)
}

export interface EngagementResource {
  id?: string;
  project_id?: string;
  name: string;
  code: string;           // references RateCardItem.code
  effort: (number | null)[]; // person-months array, up to 60 entries
  per_diem?: number;
  travel?: number;
  stay?: number;
  cola?: number;
}

export interface ProjectEngagementConfig {
  customer_name?: string;
  project_name?: string;
  project_id_ref?: string;
  contract_type?: string;
  cost_currency?: string;
  sell_currency?: string;
  start_date?: string;
  duration_months?: number;
  hours_per_month?: number;
  risk_reserve?: number;       // 0.05 = 5%
  global_discount?: number;    // 0.0 = 0%
  global_allowance?: number;   // 0.0866 = 8.66%
  background?: string;
  solution?: string;
  approver1?: string;
  approver2?: string;
  is_approved1?: boolean;
  is_approved2?: boolean;
}

export interface ExpenseItem {
  id?: string;
  project_id?: string;
  description: string;
  category: 'Software' | 'Cloud' | '3rd Party' | 'Other';
  cost: number;
  sell: number;
  date?: string;
}

export interface ForexRate {
  code: string;
  name: string;
  rate: number;
  is_auto?: boolean;
}

export interface ProjectAttachment {
  id?: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64
  uploaded_at: string;
}

// ─── Formatters ──────────────────────────────────────────────────────────────

export function getMonthLabel(startDate: string, offset: number): string {
  if (!startDate) return `M${offset + 1}`;
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + offset);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

export function formatCurrency(n: number, code = 'MYR', rate = 1): string {
  if (n === null || isNaN(n) || n === 0) return '-';
  const val = n * rate;
  const decimals = code === 'MYR' ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatCurrencyFull(n: number, code = 'MYR', rate = 1): string {
  if (n === null || isNaN(n)) return '-';
  const val = n * rate;
  const decimals = code === 'MYR' ? 0 : 2;
  return `${code} ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val)}`;
}

export function formatPM(n: number): string {
  if (n === null || isNaN(n) || n === 0) return '-';
  return n.toFixed(1);
}

export function formatPercent(n: number): string {
  if (n === null || isNaN(n)) return '-';
  return (n * 100).toFixed(1) + '%';
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

export interface CalcResourceResult {
  name: string;
  code: string;
  title: string;
  category: string;
  list: number;
  cost: number;
  sell: number;
  disc: number;
  allow: number;
  marginPct: number;
  totalPM: number;
  totalHours: number;
  revenue: number;
  costTotal: number;
  extraCost: number;
  margin: number;
}

export function calcResource(
  r: EngagementResource,
  config: ProjectEngagementConfig,
  rateCard: RateCardItem[]
): CalcResourceResult {
  const rate = rateCard.find(item => item.code === r.code);
  const disc = config.global_discount ?? 0;
  const allow = config.global_allowance ?? 0;
  const hoursPerMonth = config.hours_per_month ?? 146;

  if (!rate) {
    return {
      name: r.name || '-', code: r.code, title: '', category: '',
      list: 0, cost: 0, sell: 0, disc, allow, marginPct: 0,
      totalPM: 0, totalHours: 0, revenue: 0, costTotal: 0, extraCost: 0, margin: 0,
    };
  }

  const sell = rate.list_price * (1 - disc) * (1 + allow);
  const totalPM = (r.effort ?? []).reduce((sum, v) => (sum ?? 0) + (v ?? 0), 0) as number;
  const totalHours = (totalPM ?? 0) * hoursPerMonth;
  const revenue = totalHours * sell;
  const extraCost = (r.per_diem ?? 0) + (r.travel ?? 0) + (r.stay ?? 0) + (r.cola ?? 0);
  const costTotal = (totalHours * rate.cost_price) + extraCost;
  const margin = revenue - costTotal;
  const marginPct = revenue > 0 ? margin / revenue : 0;

  return {
    name: r.name || '-',
    code: r.code,
    title: rate.title,
    category: rate.category,
    list: rate.list_price,
    cost: rate.cost_price,
    sell,
    disc,
    allow,
    marginPct,
    totalPM: totalPM ?? 0,
    totalHours,
    revenue,
    costTotal,
    extraCost,
    margin,
  };
}

export interface ProjectTotals {
  revenue: number;
  cost: number;
  margin: number;
  pm: number;
  hours: number;
  expenseCost: number;
  expenseRevenue: number;
}

export function calcTotals(
  calcResources: CalcResourceResult[],
  expenses: ExpenseItem[]
): ProjectTotals {
  const resTotals = calcResources.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    cost: acc.cost + curr.costTotal,
    margin: acc.margin + curr.margin,
    pm: acc.pm + curr.totalPM,
    hours: acc.hours + curr.totalHours,
  }), { revenue: 0, cost: 0, margin: 0, pm: 0, hours: 0 });

  const expTotals = expenses.reduce((acc, curr) => ({
    cost: acc.cost + curr.cost,
    revenue: acc.revenue + curr.sell,
  }), { cost: 0, revenue: 0 });

  return {
    revenue: resTotals.revenue + expTotals.revenue,
    cost: resTotals.cost + expTotals.cost,
    margin: (resTotals.revenue + expTotals.revenue) - (resTotals.cost + expTotals.cost),
    pm: resTotals.pm,
    hours: resTotals.hours,
    expenseCost: expTotals.cost,
    expenseRevenue: expTotals.revenue,
  };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_ENGAGEMENT_CONFIG: ProjectEngagementConfig = {
  customer_name: '',
  project_name: '',
  project_id_ref: '',
  contract_type: 'Fixed Price (FP)',
  cost_currency: 'MYR',
  sell_currency: 'MYR',
  start_date: new Date().toISOString().split('T')[0],
  duration_months: 12,
  hours_per_month: 146,
  risk_reserve: 0.05,
  global_discount: 0.00,
  global_allowance: 0.0866,
};

export const DEFAULT_RATE_CARD: RateCardItem[] = [
  { code: '00S36F', title: 'Technology Consultant I',    category: 'Technology',   list_price: 90.10,  cost_price: 41.50 },
  { code: '00S36G', title: 'Technology Consultant II',   category: 'Technology',   list_price: 137.80, cost_price: 70.17 },
  { code: '00S36H', title: 'Technology Consultant III',  category: 'Technology',   list_price: 180.20, cost_price: 99.95 },
  { code: '00S36I', title: 'Technology Consultant IV',   category: 'Technology',   list_price: 302.10, cost_price: 155.22 },
  { code: '00S36J', title: 'Technology Consultant V',    category: 'Technology',   list_price: 371.00, cost_price: 213.57 },
  { code: '00S44F', title: 'Business Consulting I',      category: 'Consulting',   list_price: 90.10,  cost_price: 41.50 },
  { code: '00S44G', title: 'Business Consulting II',     category: 'Consulting',   list_price: 137.80, cost_price: 70.17 },
  { code: '00S44H', title: 'Business Consulting III',    category: 'Consulting',   list_price: 180.20, cost_price: 99.95 },
  { code: '00S44I', title: 'Business Consulting IV',     category: 'Consulting',   list_price: 302.10, cost_price: 155.22 },
  { code: '00S44J', title: 'Business Consulting V',      category: 'Consulting',   list_price: 371.00, cost_price: 213.57 },
  { code: '00S44K', title: 'Business Consulting VI',     category: 'Consulting',   list_price: 450.50, cost_price: 214.58 },
  { code: '00S46F', title: 'Svc Info Developer I',       category: 'Development',  list_price: 90.10,  cost_price: 41.50 },
  { code: '00S46G', title: 'Svc Info Developer II',      category: 'Development',  list_price: 137.80, cost_price: 70.17 },
  { code: '00S46H', title: 'Svc Info Developer III',     category: 'Development',  list_price: 180.20, cost_price: 99.95 },
  { code: '00S46I', title: 'Svc Info Developer IV',      category: 'Development',  list_price: 302.10, cost_price: 155.22 },
  { code: '00S46J', title: 'Svc Info Developer V',       category: 'Development',  list_price: 371.00, cost_price: 213.57 },
  { code: '00S37H', title: 'Info Systems Architect III', category: 'Architecture', list_price: 192.81, cost_price: 99.95 },
];

export const DEFAULT_FOREX: ForexRate[] = [
  { code: 'MYR', name: 'Malaysian Ringgit', rate: 1.0000 },
  { code: 'USD', name: 'US Dollar',         rate: 0.2245 },
  { code: 'SGD', name: 'Singapore Dollar',  rate: 0.3010 },
  { code: 'GBP', name: 'British Pound',     rate: 0.1785 },
  { code: 'EUR', name: 'Euro',              rate: 0.2085 },
];

export const CONTRACT_TYPES = [
  'Fixed Price (FP)',
  'Time & Materials (T&M)',
  'Amortized (Monthly)',
  'Retainer',
  'Capped T&M',
];
