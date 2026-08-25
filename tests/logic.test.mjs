/**
 * The billing arithmetic, which is the part that decides what a client is
 * charged. Run with: npm test
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { billableHours, formatClock, formatDuration, roundUp } from '../.test-build/time.js';
import {
  clientsByRecency,
  toInvoiceLines,
  totalSeconds,
} from '../.test-build/entries.js';

const MINUTE = 60;
const HOUR = 3600;

const entry = (client, task, seconds, startedAt = '2026-01-01T09:00:00Z') => ({
  id: `${client}-${task}-${seconds}-${startedAt}`,
  client,
  task,
  seconds,
  day: '2026-01-01',
  startedAt,
});

test('exact billing does not round', () => {
  assert.equal(roundUp(97, 1), 97);
});

test('rounding goes up to the next block, never down', () => {
  assert.equal(roundUp(1, 15 * MINUTE), 15 * MINUTE);
  assert.equal(roundUp(14 * MINUTE, 15 * MINUTE), 15 * MINUTE);
  assert.equal(roundUp(16 * MINUTE, 15 * MINUTE), 30 * MINUTE);
});

test('a duration already on a block boundary is left alone', () => {
  assert.equal(roundUp(30 * MINUTE, 15 * MINUTE), 30 * MINUTE);
});

test('rounding happens once on the group, not once per sitting', () => {
  // The reason this project exists. Four five-minute check-ins on one task.
  const sittings = [
    entry('Kopi Lab', 'Support call', 5 * MINUTE),
    entry('Kopi Lab', 'Support call', 5 * MINUTE),
    entry('Kopi Lab', 'Support call', 5 * MINUTE),
    entry('Kopi Lab', 'Support call', 5 * MINUTE),
  ];

  const [line] = toInvoiceLines(sittings, 15 * MINUTE);

  // Twenty minutes of work bills as half an hour.
  assert.equal(line.seconds, 30 * MINUTE);
  assert.equal(line.hours, 0.5);

  // Rounding each sitting first would have billed a full hour for the same
  // twenty minutes. That is the mistake this guards.
  const perSitting = sittings.reduce((sum, s) => sum + roundUp(s.seconds, 15 * MINUTE), 0);
  assert.equal(perSitting, HOUR);
});

test('the same task across sittings is one line', () => {
  const lines = toInvoiceLines(
    [
      entry('Kopi Lab', 'Checkout flow', HOUR),
      entry('Kopi Lab', 'Checkout flow', 30 * MINUTE),
    ],
    1,
  );

  assert.equal(lines.length, 1);
  assert.equal(lines[0].hours, 1.5);
});

test('different tasks stay separate', () => {
  const lines = toInvoiceLines(
    [entry('Kopi Lab', 'Checkout', HOUR), entry('Kopi Lab', 'Payments', HOUR)],
    1,
  );
  assert.equal(lines.length, 2);
});

test('different clients stay separate even for the same task name', () => {
  const lines = toInvoiceLines(
    [entry('Kopi Lab', 'Meeting', HOUR), entry('Nadia', 'Meeting', HOUR)],
    1,
  );
  assert.equal(lines.length, 2);
});

test('lines are grouped by client, longest task first', () => {
  const lines = toInvoiceLines(
    [
      entry('Zed', 'Short', 10 * MINUTE),
      entry('Ash', 'Short', 10 * MINUTE),
      entry('Ash', 'Long', HOUR),
    ],
    1,
  );

  assert.deepEqual(
    lines.map((l) => `${l.client}/${l.task}`),
    ['Ash/Long', 'Ash/Short', 'Zed/Short'],
  );
});

test('an empty day produces no lines and no total', () => {
  assert.deepEqual(toInvoiceLines([], 900), []);
  assert.equal(totalSeconds([]), 0);
});

test('hours are given to two places, as an invoice carries them', () => {
  assert.equal(billableHours(90 * MINUTE), 1.5);
  assert.equal(billableHours(HOUR + 20 * MINUTE), 1.33);
});

test('the clock counts hours, minutes and seconds', () => {
  assert.equal(formatClock(0), '0:00:00');
  assert.equal(formatClock(65), '0:01:05');
  assert.equal(formatClock(HOUR + 5 * MINUTE + 30), '1:05:30');
});

test('a summary drops the seconds', () => {
  assert.equal(formatDuration(45), '1m');
  assert.equal(formatDuration(HOUR), '1h');
  assert.equal(formatDuration(2 * HOUR + 15 * MINUTE), '2h 15m');
});

test('negative durations cannot appear', () => {
  assert.equal(roundUp(-500, 900), 0);
  assert.equal(formatClock(-10), '0:00:00');
});

test('clients are offered most recently worked first', () => {
  const entries = [
    entry('Old', 'a', HOUR, '2026-01-01T09:00:00Z'),
    entry('Recent', 'b', HOUR, '2026-03-01T09:00:00Z'),
    entry('Middle', 'c', HOUR, '2026-02-01T09:00:00Z'),
  ];

  assert.deepEqual(clientsByRecency(entries), ['Recent', 'Middle', 'Old']);
});
