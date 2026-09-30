import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { fromDisplayUTC, toDisplayUTC } from '~/utils/date-helpers';

// The challenge form's "UTC" schedule toggle runs every date through this pair:
// toDisplayUTC when the moderator switches to UTC, fromDisplayUTC on submit. The
// picker shows the LOCAL fields of the display value, so those fields have to be
// the UTC fields of the instant, and the pair has to round trip.

const ORIGINAL_TZ = process.env.TZ;

// Same pin as rewards-bonus-event.utils.test.ts. At TZ=UTC (what CI runs) both
// helpers are the identity, so a test that inherits the runner's zone proves nothing.
function useTimezone(tz: string) {
  beforeAll(() => {
    process.env.TZ = tz;
  });

  afterAll(() => {
    if (ORIGINAL_TZ === undefined) delete process.env.TZ;
    else process.env.TZ = ORIGINAL_TZ;
  });

  it(`is running in ${tz}`, () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(tz);
  });
}

function localFields(d: Date) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

describe('toDisplayUTC / fromDisplayUTC across a DST start (Australia/Sydney)', () => {
  useTimezone('Australia/Sydney');

  // Sydney goes AEST -> AEDT at 2026-10-03T16:00Z. A challenge starting at the next
  // UTC midnight sits inside the window where the old offset arithmetic read the
  // offset at two different instants.
  const startsAt = new Date('2026-10-04T00:00:00.000Z');

  it('shows the UTC wall clock of the instant', () => {
    expect(localFields(toDisplayUTC(startsAt))).toEqual([2026, 10, 4, 0, 0]);
  });

  it('round trips to the same instant', () => {
    expect(fromDisplayUTC(toDisplayUTC(startsAt)).toISOString()).toBe(startsAt.toISOString());
  });

  it('has a local offset that actually moves across that boundary', () => {
    expect(new Date('2026-10-03T12:00:00.000Z').getTimezoneOffset()).not.toBe(
      new Date('2026-10-04T12:00:00.000Z').getTimezoneOffset()
    );
  });
});

describe('toDisplayUTC / fromDisplayUTC across a DST end (America/New_York)', () => {
  useTimezone('America/New_York');

  // New York goes EDT -> EST at 2026-11-01T06:00Z.
  const startsAt = new Date('2026-11-01T05:00:00.000Z');

  it('shows the UTC wall clock of the instant', () => {
    expect(localFields(toDisplayUTC(startsAt))).toEqual([2026, 11, 1, 5, 0]);
  });

  it('round trips to the same instant', () => {
    expect(fromDisplayUTC(toDisplayUTC(startsAt)).toISOString()).toBe(startsAt.toISOString());
  });

  it('reads a picked wall clock as that UTC time', () => {
    // What the picker hands back when the moderator types 1 Nov 05:00 in UTC mode.
    const picked = new Date(2026, 10, 1, 5, 0);
    expect(fromDisplayUTC(picked).toISOString()).toBe('2026-11-01T05:00:00.000Z');
  });
});

describe('toDisplayUTC / fromDisplayUTC away from any transition', () => {
  useTimezone('Asia/Tokyo');

  it('keeps seconds and milliseconds and round trips', () => {
    const d = new Date('2026-09-30T18:45:12.345Z');
    const display = toDisplayUTC(d);
    expect(localFields(display)).toEqual([2026, 9, 30, 18, 45]);
    expect(display.getSeconds()).toBe(12);
    expect(display.getMilliseconds()).toBe(345);
    expect(fromDisplayUTC(display).toISOString()).toBe(d.toISOString());
  });
});
