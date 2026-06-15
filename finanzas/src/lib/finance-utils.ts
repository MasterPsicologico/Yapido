/**
 * lib/finance-utils.ts
 *
 * Funciones puras y tipos compartidos para el motor financiero de Finanzas Inteligentes.
 * Separadas del hook use-finance-store para permitir testing unitario y reuso.
 */

import type { Transaction, Budget, Currency } from '@/hooks/use-finance-store';

// ============================================================
// TIPOS DERIVADOS
// ============================================================

export type BudgetWithDerived = Budget & {
  spent: number;
  funded: number;
  daysUntilDepletion: number | null;
  avgDailySpent: number;
};

export type Totals = {
  income: number;
  expense: number;
  balance: number;
  funded: number;
  libre: number;
  realAvailable: number;
  vitalityScore: number;
};

// ============================================================
// HELPERS DE TEXTO / FECHA
// ============================================================

/** Catálogo de monedas soportadas. */
export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
];

/**
 * Normaliza un texto para comparaciones de categoría:
 * lowercase, sin acentos, sin caracteres especiales, guiones bajos.
 * "Alimentación" -> "alimentacion"
 * "Mercado & Carnes" -> "mercado___carnes"
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');
};

/** Devuelve YYYY-MM-DD en hora local del usuario. */
export const getLocalDay = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Devuelve HH:MM en hora local del usuario. */
export const getLocalTime = (date: Date = new Date()): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5);
};

/**
 * Mapa semántico de categorías: cada clave canónica tiene una lista de sinónimos
 * que el usuario puede usar en lenguaje natural.
 * El chat-IA usa este mapa para proponer categorías.
 */
export const SEMANTIC_MAP: Record<string, string[]> = {
  'alimentación': ['comida', 'desayuno', 'almuerzo', 'cena', 'restaurante', 'snack', 'cafe', 'mercado', 'supermercado', 'alimentos', 'comprar comida'],
  'transporte': ['gasolina', 'combustible', 'uber', 'taxi', 'bus', 'peaje', 'parqueadero', 'metro', 'vehiculo', 'carro', 'moto'],
  'vivienda': ['arriendo', 'alquiler', 'servicios', 'luz', 'agua', 'gas', 'internet', 'hogar', 'renta', 'apartamento'],
  'trabajo': ['sueldo', 'pago', 'nomina', 'ingresos', 'honorarios', 'salario', 'bono', 'comision', 'empleo', 'quincena', 'pago del trabajo'],
  'ocio': ['cine', 'salida', 'fiesta', 'bar', 'cerveza', 'viaje', 'turismo', 'entretenimiento', 'hobby', 'diversion'],
  'salud': ['medico', 'medicina', 'farmacia', 'hospital', 'dentista', 'gimnasio', 'deporte', 'clinica', 'doctor'],
};

/**
 * Resuelve la categoría canónica a partir de la entrada cruda del usuario.
 * Si la entrada coincide con un sinónimo en SEMANTIC_MAP, devuelve la clave canónica
 * capitalizada. Si no, devuelve la entrada original.
 */
export const resolveCategory = (rawCategory: string): { canonical: string; normalized: string } => {
  const inputCatRaw = (rawCategory || '').trim();
  let normalizedInput = normalizeText(inputCatRaw);
  let canonical = inputCatRaw;

  for (const [main, synonyms] of Object.entries(SEMANTIC_MAP)) {
    const normalizedMain = normalizeText(main);
    const normalizedSynonyms = synonyms.map(s => normalizeText(s));
    if (normalizedSynonyms.includes(normalizedInput) || normalizedInput === normalizedMain) {
      canonical = main.charAt(0).toUpperCase() + main.slice(1);
      normalizedInput = normalizedMain;
      break;
    }
  }

  return { canonical, normalized: normalizedInput };
};

// ============================================================
// CÁLCULOS DE PRESUPUESTO
// ============================================================

/**
 * Calcula el monto "funded" de un presupuesto según su estrategia de asignación:
 * - 'manual': usa el valor `funded` del documento tal cual.
 * - 'fixed': funded = (días con ingreso en el rango) × allocationValue.
 * - 'percentage': funded = (suma de ingresos en el rango) × (allocationValue / 100).
 */
export const computeDerivedFunded = (
  budget: Budget,
  incomeDays: Set<string>,
  allTransactions: Transaction[]
): number => {
  if (budget.type !== 'gasto') return budget.funded || 0;

  const s = budget.startDate || '0000-00-00';
  const e = budget.endDate || '9999-99-99';

  if (budget.allocationType === 'fixed') {
    const workingDaysInRange = Array.from(incomeDays).filter(day => day >= s && day <= e).length;
    return workingDaysInRange * (budget.allocationValue || 0);
  }

  if (budget.allocationType === 'percentage') {
    const totalIncomeInRange = allTransactions
      .filter(t => t.type === 'ingreso' && t.date.split('T')[0] >= s && t.date.split('T')[0] <= e)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return totalIncomeInRange * ((budget.allocationValue || 0) / 100);
  }

  return budget.funded || 0;
};

/**
 * Calcula la previsión de quiebra (días hasta agotar el presupuesto).
 * Retorna `null` si no aplica (presupuesto tipo ingreso, sin límite, o sin gasto).
 */
export const computeDaysUntilDepletion = (
  budget: Budget,
  actualTotal: number,
  now: Date = new Date()
): { daysUntilDepletion: number | null; avgDailySpent: number } => {
  if (budget.type !== 'gasto' || budget.limit <= 0) {
    return { daysUntilDepletion: null, avgDailySpent: 0 };
  }

  const startDate = new Date((budget.startDate || '0000-00-00') + 'T00:00:00');
  const daysPassed = Math.max(
    1,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgDailySpent = actualTotal / daysPassed;
  const remaining = budget.limit - actualTotal;

  if (remaining <= 0) {
    return { daysUntilDepletion: 0, avgDailySpent };
  }

  if (avgDailySpent <= 0) {
    return { daysUntilDepletion: null, avgDailySpent: 0 };
  }

  return { daysUntilDepletion: Math.floor(remaining / avgDailySpent), avgDailySpent };
};

/**
 Enriquece un array de budgets crudos con `spent`, `funded`, `daysUntilDepletion` y `avgDailySpent`.
 */
export const enrichBudgets = (rawBudgets: Budget[], transactions: Transaction[]): BudgetWithDerived[] => {
  const incomeDays = new Set(
    transactions.filter(t => t.type === 'ingreso').map(t => t.date.split('T')[0])
  );
  const now = new Date();

  return rawBudgets.map(b => {
    const s = b.startDate || '0000-00-00';
    const e = b.endDate || '9999-99-99';

    const relevantTransactions = transactions.filter(t => {
      const tDay = t.date.split('T')[0];
      const isCatMatch = normalizeText(t.category) === normalizeText(b.category);
      return isCatMatch && t.type === b.type && tDay >= s && tDay <= e;
    });
    const actualTotal = relevantTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

    const derivedFunded = computeDerivedFunded(b, incomeDays, transactions);
    const { daysUntilDepletion, avgDailySpent } = computeDaysUntilDepletion(b, actualTotal, now);

    return {
      ...b,
      spent: actualTotal,
      funded: derivedFunded,
      daysUntilDepletion,
      avgDailySpent,
    };
  });
};

// ============================================================
// CÁLCULOS DE TOTALES Y VITALITY
// ============================================================

/**
 * Calcula el Vitality Score (0-100):
 * - 0 si el balance es <= 0
 * - 100 si no hay gastos pendientes
 * - Proporción balance / (balance + pendientes) en caso intermedio
 */
export const computeVitalityScore = (balance: number, pendingExpenses: number): number => {
  if (balance <= 0) return 0;
  if (pendingExpenses <= 0) return 100;
  return Math.max(0, Math.min(100, (balance / (balance + pendingExpenses)) * 100));
};

/**
 * Calcula todos los totales del dashboard:
 * ingresos, gastos, balance, fondos reservados, vitalidad.
 */
export const computeTotals = (transactions: Transaction[], enrichedBudgets: BudgetWithDerived[]): Totals => {
  const income = transactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + (t.amount || 0), 0);
  const balance = income - expense;

  const now = new Date();
  const referenceDate = transactions.length > 0 ? new Date(transactions[0].date) : now;
  const refStr = referenceDate.toISOString().split('T')[0];

  const activeExpenses = enrichedBudgets.filter(
    b =>
      b.type === 'gasto' &&
      (b.startDate || '0000-00-00') <= refStr &&
      (b.endDate || '9999-12-31') >= refStr
  );

  const funded = activeExpenses.reduce((acc, b) => acc + (b.funded || 0), 0);
  const pendingExpenses = activeExpenses.reduce((acc, b) => acc + Math.max(0, (b.limit || 0) - (b.spent || 0)), 0);
  const realAvailable = balance - pendingExpenses;
  const vitalityScore = computeVitalityScore(balance, pendingExpenses);

  return {
    income,
    expense,
    balance,
    funded,
    libre: balance - funded,
    realAvailable,
    vitalityScore,
  };
};
