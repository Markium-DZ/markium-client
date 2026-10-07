import { format, getTime, formatDistanceToNow } from 'date-fns';
import { enUS, fr, arSA } from 'date-fns/locale';

const DATE_FNS_LOCALES = { en: enUS, fr, ar: arSA };

// ----------------------------------------------------------------------

export function fDate(date, newFormat) {
  const fm = newFormat || 'dd/MM/yyyy';

  return date ? format(new Date(date), fm) : '';
}

export function fTime(date, newFormat) {
  const fm = newFormat || 'p';

  return date ? format(new Date(date), fm) : '';
}

export function fDateTime(date, newFormat) {
  const fm = newFormat || 'dd MM yyyy p';

  return date ? format(new Date(date), fm) : '';
}

export function fTimestamp(date) {
  return date ? getTime(new Date(date)) : '';
}

export function fToNow(date, lang) {
  return date
    ? formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: DATE_FNS_LOCALES[lang] || enUS,
      })
    : '';
}

export function isBetween(inputDate, startDate, endDate) {
  const date = new Date(inputDate);

  const results =
    new Date(date.toDateString()) >= new Date(startDate.toDateString()) &&
    new Date(date.toDateString()) <= new Date(endDate.toDateString());

  return results;
}

export function isAfter(startDate, endDate) {
  const results =
    startDate && endDate ? new Date(startDate).getTime() > new Date(endDate).getTime() : false;

  return results;
}
