import test from 'node:test';
import assert from 'node:assert/strict';
import * as contract from './health-contract.mjs';
import * as assistance from '../assistance/domain.mjs';
import * as healthSync from '../health-sync/health-parser.mjs';

const now = '2026-10-28T10:00:00.000Z';
const healthDay = metrics => ({
  schemaVersion: 1,
  date: '2026-10-28',
  provider: 'APPLE_HEALTH',
  timezone: 'Europe/Berlin',
  source: contract.HEALTH_SOURCE,
  fetchedAt: now,
  sourceLastSyncAt: null,
  sourceLastDataAt: null,
  metrics,
});

test('assistance and Health sync expose the same canonical contract objects', () => {
  assert.strictEqual(assistance.HEALTH_METRICS, contract.HEALTH_METRICS);
  assert.strictEqual(healthSync.HEALTH_METRICS, contract.HEALTH_METRICS);
  assert.strictEqual(assistance.validHealthDate, contract.validHealthDate);
  assert.strictEqual(healthSync.validHealthDate, contract.validHealthDate);
  assert.strictEqual(assistance.validateHealthDay, contract.validateHealthDay);
});

test('shared day validation preserves accepted records and exact error codes', () => {
  const valid = healthDay({
    steps_total: {
      value: 1234,
      unit: 'count',
      sourceDevice: 'Merged (HealthKit daily statistics)',
      updatedAt: now,
    },
  });
  assert.strictEqual(contract.validateHealthDay(valid, valid.date), valid);
  assert.throws(
    () => contract.validateHealthDay(healthDay({ steps_total: { ...valid.metrics.steps_total, sourceDevice: 'iPhone' } }), valid.date),
    error => error.code === 'HEALTH_NON_MERGED_RECORD' && error.message === 'HEALTH_NON_MERGED_RECORD',
  );
  assert.throws(
    () => contract.validateHealthDay({ ...valid, fetchedAt: 'not-a-timestamp' }, valid.date),
    error => error.code === 'HEALTH_INVALID_TIMESTAMP' && error.message === 'HEALTH_INVALID_TIMESTAMP',
  );
});

test('shared index validation retains null, bounds and duplicate-date behavior', () => {
  assert.equal(contract.validateHealthIndex(null), null);
  const index = {
    schemaVersion: 1,
    source: contract.HEALTH_SOURCE,
    provider: 'APPLE_HEALTH',
    timezone: 'Europe/Berlin',
    fetchedAt: now,
    sourceLastSyncAt: null,
    sourceLastDataAt: null,
    days: [{ date: '2026-10-28', metricCount: 1, fetchedAt: now }],
  };
  assert.strictEqual(contract.validateHealthIndex(index), index);
  assert.throws(
    () => contract.validateHealthIndex({ ...index, days: [...index.days, ...index.days] }),
    error => error.code === 'HEALTH_INVALID_INDEX',
  );
});
