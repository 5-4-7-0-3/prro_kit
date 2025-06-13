import { v4 as uuidv4 } from 'uuid';
import { getCurrentPRRODate, getCurrentPRROTime } from './dateTimeKit';

/**
 * Опції для створення метаданих документа
 */
export interface CreateMetaOptions {
    isTestMode?: boolean;
    uuidFn?: () => string;
    isoString?: string;
    timeZone?: string;
}

/**
 * Метадані PRRO документа
 */
export interface MetaData {
    uid: string;
    date: string;
    time: string;
    testing: boolean;
    timestamp: Date;
}

/**
 * Генерує метадані для PRRO документа
 * @param opts - Опції генерації
 * @returns Об'єкт метаданих
 */
export function createMeta(opts: CreateMetaOptions = {}): MetaData {
    const { 
        isTestMode = false, 
        uuidFn = uuidv4, 
        timeZone, 
        isoString 
    } = opts;

    const timestamp = isoString ? new Date(isoString) : new Date();

    return {
        uid: uuidFn(),
        date: getCurrentPRRODate(),
        time: getCurrentPRROTime(),
        testing: isTestMode,
        timestamp
    };
}

/**
 * Валідує UID документа
 * @param uid - UID для валідації
 * @returns true якщо UID валідний
 */
export function isValidUID(uid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uid);
}

/**
 * Створює детерміністичний UID для тестів
 * @param seed - Seed для генерації
 * @returns Детерміністичний UID
 */
export function createTestUID(seed: string = 'test'): string {
    // Простий хеш для створення консистентного UUID в тестах
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(0, 3)}-a${hex.slice(0, 3)}-${hex.slice(0, 12).padEnd(12, '0')}`;
}