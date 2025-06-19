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
 * Отримує поточний UTC час з українським offset
 * Використовується для синхронізації часу між серверами в різних часових поясах
 */
function getUkraineTime(isoString?: string): dayjs.Dayjs {
    // Завжди працюємо з UTC та додаємо український offset
    const baseTime = isoString ? dayjs.utc(isoString) : dayjs.utc();

    // Український час - це UTC+2 (зимовий) або UTC+3 (літній)
    // Для PRRO використовуємо фіксований offset UTC+2 взимку та UTC+3 влітку
    // Визначаємо чи зараз літній час в Україні
    const ukraineTime = baseTime.tz('Europe/Kyiv');

    return ukraineTime;
}

/**
 * Повертає відформатовану дату/час для PRRO документів
 * @param opts - Опції форматування
 * @returns Відформатована дата/час
 */
export function getDateTime(opts: DateTimeOptions = {}): string {
    const { format = 'default', isoString } = opts;

    // Завжди використовуємо український час незалежно від розташування сервера
    const dt = getUkraineTime(isoString);
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
