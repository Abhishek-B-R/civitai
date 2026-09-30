import type { ConfigType } from 'dayjs';
import { formatDate } from '~/utils/date-helpers';

// The date pickers hand back local midnight, so the picked day is in the local fields. Reading
// the UTC ones gives the day before for anyone east of UTC.
export function toBountyDateString(value: ConfigType) {
  return formatDate(value, 'YYYY-MM-DD');
}
