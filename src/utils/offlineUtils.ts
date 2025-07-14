import * as crypto from 'crypto';
import { crc32 } from 'crc';
import { ControlNumberData, OfflineSessionStats } from '../core/offline-types';

/**
 * Обчислює SHA-256 геш
 * @param data - Дані для хешування (рядок або Buffer)
 * @returns Геш в шістнадцятковому форматі
 */
export function sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Розраховує контрольне число для офлайн документа
 * @param data - Дані для розрахунку
 * @returns Контрольне число (4 молодші розряди CRC32)
 */
export function calculateControlNumber(data: ControlNumberData): number {
    // Формуємо рядок для CRC32 згідно з документацією
    const parts: string[] = [
        data.offlineSeed.toString(),
        data.date,
        data.time,
        data.localNum.toString(),
        data.fiscalNum,
        data.localRegNum.toString(),
    ];

    // Додаємо суму якщо є (тільки для чеків класу "Чек")
    if (data.totalAmount !== undefined && data.totalAmount > 0) {
        parts.push(data.totalAmount.toFixed(2));
    }

    // Додаємо геш попереднього документа якщо є
    // Згідно з документацією: не використовується для документа "Початок офлайн сесії"
    // та наступного за ним документа
    if (data.prevDocHash) {
        parts.push(data.prevDocHash);
    }

    const str = parts.join(',');
    const checksum = crc32(str);
    const HEX_RADIX = 16;
    const CRC32_LENGTH = 8;
    const DIVIDER_TO_GET_LAST_FOUR_DIGITS = 10000;
    const DEFAULT_CONTROL_CODE = 1;

    const crc32String = checksum.toString(HEX_RADIX);
    const fullCrc32String = '00000000'.substring(0, CRC32_LENGTH - crc32String.length) + crc32String;
    const unsignedInt = Buffer.from(fullCrc32String, 'hex').readUInt32LE();
    const lastFourDigits = unsignedInt % DIVIDER_TO_GET_LAST_FOUR_DIGITS;

    return lastFourDigits || DEFAULT_CONTROL_CODE;
}

/**
 * Формує фіскальний номер офлайн документа
 * @param sessionId - Ідентифікатор офлайн сесії
 * @param localNum - Локальний номер в офлайн сесії
 * @param controlNumber - Контрольне число
 * @returns Фіскальний номер офлайн документа
 */
export function formatOfflineFiscalNumber(sessionId: string, localNum: number, controlNumber: number): string {
    return `${sessionId}.${localNum}.${controlNumber}`;
}

/**
 * Парсить фіскальний номер офлайн документа
 * @param fiscalNumber - Фіскальний номер для парсингу
 * @returns Об'єкт з компонентами номера або null
 */
export function parseOfflineFiscalNumber(fiscalNumber: string): {
    sessionId: number;
    localNum: number;
    controlNumber: number;
} | null {
    const parts = fiscalNumber.split('.');
    if (parts.length !== 3) {
        return null;
    }

    const sessionId = parseInt(parts[0], 10);
    const localNum = parseInt(parts[1], 10);
    const controlNumber = parseInt(parts[2], 10);

    if (isNaN(sessionId) || isNaN(localNum) || isNaN(controlNumber)) {
        return null;
    }

    return { sessionId, localNum, controlNumber };
}

/**
 * Перевіряє чи є номер офлайн фіскальним номером
 * @param fiscalNumber - Номер для перевірки
 * @returns true якщо це офлайн номер
 */
export function isOfflineFiscalNumber(fiscalNumber: string): boolean {
    return parseOfflineFiscalNumber(fiscalNumber) !== null;
}

/**
 * Розраховує статистику офлайн сесії
 * @param sessionStart - Початок сесії
 * @param monthlyDuration - Загальна тривалість за місяць (хвилини)
 * @param documentsCount - Кількість документів
 * @returns Статистика сесії
 */
export function calculateOfflineSessionStats(
    sessionStart: Date,
    monthlyDuration: number = 0,
    documentsCount: number = 0,
): OfflineSessionStats {
    const now = new Date();
    const currentDuration = Math.floor((now.getTime() - sessionStart.getTime()) / 60000); // в хвилинах

    const MAX_SESSION_DURATION = 2160; // 36 годин
    const MAX_MONTHLY_DURATION = 10080; // 168 годин

    const totalMonthlyDuration = monthlyDuration + currentDuration;
    const isOverDailyLimit = currentDuration > MAX_SESSION_DURATION;
    const isOverMonthlyLimit = totalMonthlyDuration > MAX_MONTHLY_DURATION;

    let remainingTime = MAX_SESSION_DURATION - currentDuration;
    const monthlyRemaining = MAX_MONTHLY_DURATION - totalMonthlyDuration;

    if (monthlyRemaining < remainingTime) {
        remainingTime = monthlyRemaining;
    }

    if (remainingTime < 0) {
        remainingTime = 0;
    }

    return {
        sessionId: '',
        currentDuration,
        monthlyDuration: totalMonthlyDuration,
        documentsCount,
        isOverDailyLimit,
        isOverMonthlyLimit,
        remainingTime,
    };
}

/**
 * Конвертує час з хвилин у читабельний формат
 * @param minutes - Кількість хвилин
 * @returns Форматований рядок (наприклад, "2г 30хв")
 */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins}хв`;
    }

    if (mins === 0) {
        return `${hours}г`;
    }

    return `${hours}г ${mins}хв`;
}

/**
 * Створює бінарний пакет офлайн документів
 * @param documents - Масив документів (Base64 encoded)
 * @returns Buffer з пакетом документів
 */
export function createOfflinePackage(documents: string[]): Buffer {
    const buffers: Buffer[] = [];

    for (const doc of documents) {
        const docBuffer = Buffer.from(doc, 'base64');
        const sizeBuffer = Buffer.allocUnsafe(4);
        sizeBuffer.writeUInt32LE(docBuffer.length, 0);

        buffers.push(sizeBuffer);
        buffers.push(docBuffer);
    }

    return Buffer.concat(buffers);
}

/**
 * Парсить бінарний пакет офлайн документів
 * @param packageBuffer - Buffer з пакетом
 * @returns Масив документів (Base64 encoded)
 */
export function parseOfflinePackage(packageBuffer: Buffer): string[] {
    const documents: string[] = [];
    let offset = 0;

    while (offset < packageBuffer.length) {
        if (offset + 4 > packageBuffer.length) {
            throw new Error('Invalid package format: incomplete size header');
        }

        const size = packageBuffer.readUInt32LE(offset);
        offset += 4;

        if (offset + size > packageBuffer.length) {
            throw new Error('Invalid package format: document size exceeds package');
        }

        const docBuffer = packageBuffer.slice(offset, offset + size);
        documents.push(docBuffer.toString('base64'));
        offset += size;
    }

    return documents;
}

/**
 * Перевіряє чи можна продовжувати офлайн сесію
 * @param stats - Статистика сесії
 * @returns true якщо можна продовжувати
 */
export function canContinueOfflineSession(stats: OfflineSessionStats): boolean {
    return !stats.isOverDailyLimit && !stats.isOverMonthlyLimit && stats.remainingTime > 0;
}

/**
 * Отримує попередження про закінчення офлайн часу
 * @param stats - Статистика сесії
 * @returns Масив попереджень
 */
export function getOfflineWarnings(stats: OfflineSessionStats): string[] {
    const warnings: string[] = [];

    if (stats.remainingTime <= 60 && stats.remainingTime > 0) {
        warnings.push(`Увага! До закінчення офлайн режиму залишилось ${formatDuration(stats.remainingTime)}`);
    }

    if (stats.isOverDailyLimit) {
        warnings.push('Перевищено денний ліміт офлайн режиму (36 годин)');
    }

    if (stats.isOverMonthlyLimit) {
        warnings.push('Перевищено місячний ліміт офлайн режиму (168 годин)');
    }

    if (stats.monthlyDuration > 8400) {
        // 140 годин - 80% від ліміту
        warnings.push(`Використано ${formatDuration(stats.monthlyDuration)} з 168 годин місячного ліміту`);
    }

    return warnings;
}
