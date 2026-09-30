import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { toBountyDateString } from '~/components/Bounty/bounty-dates';
import { dateWithoutTimezone } from '~/utils/date-helpers';

// The bounty form's date pickers return local midnight for the picked day, and the server
// stores the submitted YYYY-MM-DD as that day at 00:00 UTC. The form loads a stored date back
// through dateWithoutTimezone, so saving without touching the dates must send the same day.

const ORIGINAL_TZ = process.env.TZ;

// At TZ=UTC (what CI runs) local and UTC fields agree, so the zone has to be pinned.
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

describe.each(['Asia/Tokyo', 'Europe/Berlin', 'America/Los_Angeles'])(
  'toBountyDateString in %s',
  (tz) => {
    useTimezone(tz);

    it('sends the day the user picked', () => {
      const picked = new Date(2026, 9, 5); // what the picker returns for 5 Oct
      expect(toBountyDateString(picked)).toBe('2026-10-05');
    });

    it('sends a stored date back unchanged when the form is saved as loaded', () => {
      const storedExpiresAt = new Date('2026-10-12T00:00:00.000Z');
      expect(toBountyDateString(dateWithoutTimezone(storedExpiresAt))).toBe('2026-10-12');
    });
  }
);
