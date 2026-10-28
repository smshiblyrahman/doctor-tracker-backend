const test = require('node:test');
const assert = require('node:assert/strict');
const escapeRegex = require('../src/utils/escapeRegex');
const { parsePagination, buildCreatedAtFilter } = require('../src/utils/query');

test('escapeRegex treats user input as literal text', () => {
  assert.equal(new RegExp(escapeRegex('Dr. A+ (test)')).test('Dr. A+ (test)'), true);
  assert.equal(new RegExp(escapeRegex('Dr. A+ (test)')).test('DrX AAAAA test'), false);
});

test('parsePagination applies defaults and calculates skip', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '20' }), { page: 3, limit: 20, skip: 40 });
});

test('parsePagination rejects out-of-range limits', () => {
  assert.throws(() => parsePagination({ limit: '100' }), /between 1 and 50/);
  assert.throws(() => parsePagination({ page: '0' }), /positive integer/);
});

test('buildCreatedAtFilter creates a UTC inclusive date range', () => {
  const filter = buildCreatedAtFilter('2026-10-01', '2026-10-02');
  assert.equal(filter.$gte.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(filter.$lte.toISOString(), '2026-10-02T23:59:59.999Z');
});

test('buildCreatedAtFilter rejects invalid and reversed dates', () => {
  assert.throws(() => buildCreatedAtFilter('2026-02-30', ''), /valid date/);
  assert.throws(() => buildCreatedAtFilter('2026-10-03', '2026-10-02'), /on or before/);
});
