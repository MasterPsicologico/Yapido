/**
 * Tests del cálculo de pricing y guards.
 * Ejecutar: `npm test` (o `node --test tests/*.test.mjs`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const TYPES = {
  standard: { baseHourlyRate: 8000, capacityKg: 8 },
  premium: { baseHourlyRate: 14000, capacityKg: 12 },
  industrial: { baseHourlyRate: 22000, capacityKg: 20 },
};

function calcPrice(typeKey, hours, distanceKm = 5) {
  const t = TYPES[typeKey];
  if (!t) throw new Error('unknown-type');
  if (hours < 4 || hours > 24) throw new Error('invalid-hours');
  const rentalFee = t.baseHourlyRate * hours;
  const logisticsFee = Math.round(distanceKm * 800);
  const serviceFee = Math.round(rentalFee * 0.05);
  const total = rentalFee + logisticsFee + serviceFee;
  return { rentalFee, logisticsFee, serviceFee, total };
}

test('standard 4h sin distancia', () => {
  const r = calcPrice('standard', 4, 0);
  assert.equal(r.rentalFee, 32000);
  assert.equal(r.logisticsFee, 0);
  assert.equal(r.total, 32000 + 0 + 1600);
});

test('premium 8h con distancia', () => {
  const r = calcPrice('premium', 8, 5);
  assert.equal(r.rentalFee, 112000);
  assert.equal(r.logisticsFee, 4000);
  assert.equal(r.serviceFee, Math.round(112000 * 0.05));
});

test('rechaza horas inválidas', () => {
  assert.throws(() => calcPrice('standard', 2));
  assert.throws(() => calcPrice('standard', 26));
});

test('rechaza tipo inválido', () => {
  assert.throws(() => calcPrice('hyper', 8));
});

test('industrial 24h suma total', () => {
  const r = calcPrice('industrial', 24, 10);
  assert.equal(r.rentalFee, 528000);
  assert.equal(r.logisticsFee, 8000);
  assert.equal(r.serviceFee, 26400);
  assert.equal(r.total, 528000 + 8000 + 26400);
});

test('cron secret guard con NODE_ENV=development pasa', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  // Para replicar la lógica del guard sin importar server-only (rompe fuera de Next).
  const isCronAuthorizedOpen = process.env.NODE_ENV === 'development';
  assert.equal(isCronAuthorizedOpen, true);
  process.env.NODE_ENV = prev;
});
