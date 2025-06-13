/**
 * PRRO Kit - Бібліотека для генерації XML документів PRRO
 * 
 * Основні можливості:
 * - Генерація XML документів для фіскальних операцій
 * - Підтримка онлайн та офлайн режимів
 * - Валідація даних перед генерацією XML
 * - Типобезпечний API з повною підтримкою TypeScript
 */

// Core types and constants
export type {
    ShiftData,
    ReceiptLine,
    PaymentData,
    RefundData,
    ZReportData,
    ValidationResult,
    XMLDocumentResult
} from './core/types';

export {
    PRRO_CONSTANTS,
    DOC_TYPES,
    PAYMENT_METHODS,
    OPERATION_TYPES
} from './core/constants';

// Builders
export { PRROBuilder } from './builder/base-builder';
export { OnlineDocumentBuilder } from './builder/online-builder';
export { OfflineDocumentBuilder } from './builder/offline-builder';

// Validator
export { PRROValidator } from './validator/validator';

// Error handling
export {
    PRROError,
    ValidationError,
    XMLError,
    BuilderError
} from './errors/errors';

// Utilities - часто використовувані
export {
    createMeta,
    getCurrentPRRODate,
    getCurrentPRROTime,
    formatAmount,
    formatQuantity,
    isValidTIN,
    isValidAmount,
    sanitizeXMLString,
    type MetaData,
    type CreateMetaOptions
} from './utils';

// Re-export всіх утиліт для розширеного використання
export * as Utils from './utils';

/**
 * Версія бібліотеки
 */
export const VERSION = '0.2.0';

/**
 * Фабрика для швидкого створення білдера
 * @param shift - Дані зміни
 * @param testMode - Режим тестування
 * @returns Налаштований білдер
 */
export function createPRROBuilder(shift: ShiftData, testMode: boolean = false): PRROBuilder {
    return new PRROBuilder(shift).setTestMode(testMode);
}

/**
 * Фабрика для створення онлайн білдера
 * @param shift - Дані зміни
 * @param testMode - Режим тестування
 * @returns Налаштований онлайн білдер
 */
export function createOnlineBuilder(shift: ShiftData, testMode: boolean = false): OnlineDocumentBuilder {
    return new OnlineDocumentBuilder(shift).setTestMode(testMode);
}

/**
 * Фабрика для створення офлайн білдера
 * @param shift - Дані зміни
 * @param testMode - Режим тестування
 * @returns Налаштований офлайн білдер
 */
export function createOfflineBuilder(shift: ShiftData, testMode: boolean = false): OfflineDocumentBuilder {
    return new OfflineDocumentBuilder(shift).setTestMode(testMode);
}

/**
 * Швидка валідація основних даних
 * @param shift - Дані зміни для валідації
 * @returns Результат валідації
 */
export function quickValidateShift(shift: ShiftData): ValidationResult {
    const validator = new PRROValidator();
    return validator.validateShift(shift);
}

// Default export для зручності
export default {
    createPRROBuilder,
    createOnlineBuilder,
    createOfflineBuilder,
    quickValidateShift,
    PRROBuilder,
    OnlineDocumentBuilder,
    OfflineDocumentBuilder,
    PRROValidator,
    Utils,
    VERSION
};