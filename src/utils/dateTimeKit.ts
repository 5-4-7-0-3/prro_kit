import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Попередньо визначені формати дати/часу
 */
export const predefinedFormats = {
    default: 'DD.MM.YYYY HH:mm:ss',
    date: 'DD.MM.YYYY',
    time: 'HH:mm:ss',
    dateNumeric: 'DDMMYYYY',
    timeNumeric: 'HHmmss',
} as const;

export type PredefinedFormat = keyof typeof predefinedFormats;

/**
 * Повертає відформатовану дату/час
 * @param {Object} opts - Опції форматування
 * @param {PredefinedFormat | string} [opts.format='default'] - Формат виводу
 * @param {string} [opts.isoString] - ISO-рядок для парсингу (за замовчуванням поточна дата)
 * @param {string} [opts.timeZone='Europe/Kyiv'] - Часовий пояс
 * @returns {string} Відформатована дата/час
 */
export function getDateTime(
    opts: {
        format?: PredefinedFormat | string;
        isoString?: string;
        timeZone?: string;
    } = {},
): string {
    const { format = 'default', isoString, timeZone = 'Europe/Kyiv' } = opts;
    const dt = isoString ? dayjs(isoString).tz(timeZone) : dayjs().tz(timeZone);
    const selectedFormat = predefinedFormats[format as PredefinedFormat] ?? format;
    return dt.format(selectedFormat);
}
