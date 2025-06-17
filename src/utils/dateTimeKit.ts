import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Попередньо визначені формати дати/часу для PRRO
 */
export const PRRO_DATE_FORMATS = {
    default: 'DD.MM.YYYY HH:mm:ss',
    date: 'DD.MM.YYYY',
    time: 'HH:mm:ss',
    dateNumeric: 'DDMMYYYY',
    timeNumeric: 'HHmmss',
    isoDate: 'YYYY-MM-DD',
    isoDateTime: 'YYYY-MM-DDTHH:mm:ss',
} as const;

export type DateFormat = keyof typeof PRRO_DATE_FORMATS;

/**
 * Опції для форматування дати/часу
 */
export interface DateTimeOptions {
    format?: DateFormat | string;
    isoString?: string;
    timeZone?: string;
}

/**
 * Повертає відформатовану дату/час для PRRO документів
 * @param opts - Опції форматування
 * @returns Відформатована дата/час
 */
export function getDateTime(opts: DateTimeOptions = {}): string {
    const { format = 'default', isoString, timeZone = 'Europe/Kyiv' } = opts;

    const dt = isoString ? dayjs(isoString).tz(timeZone) : dayjs().tz(timeZone);
    const selectedFormat = PRRO_DATE_FORMATS[format as DateFormat] ?? format;

    return dt.format(selectedFormat);
}

/**
 * Повертає поточну дату в форматі PRRO (DDMMYYYY)
 */
export function getCurrentPRRODate(): string {
    return getDateTime({ format: 'dateNumeric' });
}

/**
 * Повертає поточний час в форматі PRRO (HHmmss)
 */
export function getCurrentPRROTime(): string {
    return getDateTime({ format: 'timeNumeric' });
}

/**
 * Валідує чи відповідає дата формату PRRO
 * @param date - Дата для валідації
 * @param format - Очікуваний формат
 * @returns true якщо дата валідна
 */
export function isValidPRRODate(date: string, format: DateFormat = 'dateNumeric'): boolean {
    const formatPattern = PRRO_DATE_FORMATS[format];
    const parsed = dayjs(date, formatPattern, true);
    return parsed.isValid();
}

/**
 * Конвертує ISO дату в PRRO формат
 * @param isoString - ISO дата
 * @param format - Цільовий PRRO формат
 * @returns Дата в PRRO форматі
 */
export function isoToPRRODate(isoString: string, format: DateFormat = 'dateNumeric'): string {
    return getDateTime({ format, isoString });
}
