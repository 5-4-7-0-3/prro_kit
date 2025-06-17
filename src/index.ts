import { PRROBuilder, OnlineDocumentBuilder, OfflineDocumentBuilder } from './builder';
import { createPRROApiClient, PRROApiClient } from './client';
import { ShiftData, ValidationResult, ReceiptLine, PaymentData } from './core';
import { PRROValidator } from './validator';

// Core types and constants
export type {
    ShiftData,
    ReceiptLine,
    PaymentData,
    RefundData,
    ZReportData,
    ValidationResult,
    XMLDocumentResult,
    DocumentType,
    PaymentMethod,
    DocumentSubtype,
} from './core/types';

export {
    PRRO_CONSTANTS,
    DOC_TYPES,
    DOC_SUBTYPES,
    PAYMENT_TYPES,
    PAYMENT_METHODS,
    OPERATION_TYPES,
} from './core/constants';

// Builders
export { PRROBuilder } from './builder/base-builder';
export { OnlineDocumentBuilder } from './builder/online-builder';
export { OfflineDocumentBuilder } from './builder/offline-builder';

// Validator
export { PRROValidator } from './validator/validator';

// API Client
export { PRROApiClient, createPRROApiClient } from './client';

// Error handling
export { PRROError, ValidationError, XMLError, BuilderError } from './errors/errors';

// Utilities
export {
    // DateTime
    getDateTime,
    getCurrentPRRODate,
    getCurrentPRROTime,
    isValidPRRODate,
    isoToPRRODate,
    PRRO_DATE_FORMATS,
    type DateFormat,
    type DateTimeOptions,

    // Meta
    createMeta,
    isValidUID,
    createTestUID,
    type CreateMetaOptions,
    type MetaData,

    // XML
    buildXml,
    isValidXML,
    extractElementValue,
    objectToXMLElements,

    // Validation
    isValidTIN,
    isValidFiscalNumber,
    isValidOrderNumber,
    isValidAmount,
    isValidQuantity,
    formatAmount,
    formatQuantity,
    isValidItemName,
    sanitizeXMLString,
} from './utils';

/**
 * Версія бібліотеки
 */
export const VERSION = '0.2.0';

/**
 * Створює білдер для PRRO документів
 * @param shift - Дані зміни
 * @param testMode - Увімкнути тестовий режим (за замовчуванням false)
 * @returns Налаштований білдер PRRO
 * @example
 * ```typescript
 * const shift: ShiftData = {
 *   tin: '1234567890',
 *   orgName: 'ТОВ "Моя компанія"',
 *   // ... інші поля
 * };
 *
 * const builder = createPRROBuilder(shift, true); // тестовий режим
 * ```
 */
export function createPRROBuilder(shift: ShiftData, testMode: boolean = false): PRROBuilder {
    return new PRROBuilder(shift).setTestMode(testMode);
}

/**
 * Створює білдер для онлайн документів
 * @param shift - Дані зміни
 * @param testMode - Увімкнути тестовий режим (за замовчуванням false)
 * @returns Налаштований онлайн білдер
 */
export function createOnlineBuilder(shift: ShiftData, testMode: boolean = false): OnlineDocumentBuilder {
    return new OnlineDocumentBuilder(shift).setTestMode(testMode);
}

/**
 * Створює білдер для офлайн документів
 * @param shift - Дані зміни
 * @param testMode - Увімкнути тестовий режим (за замовчуванням false)
 * @returns Налаштований офлайн білдер
 * @example
 * ```typescript
 * const builder = createOfflineBuilder(shift);
 *
 * // Початок офлайн сесії
 * const beginOffline = builder.buildOfflineBegin();
 *
 * // Офлайн чек
 * const receipt = builder.buildOfflineReceipt(lines, payment, '123456789');
 *
 * // Завершення офлайн сесії
 * const endOffline = builder.buildOfflineEnd();
 * ```
 */
export function createOfflineBuilder(shift: ShiftData, testMode: boolean = false): OfflineDocumentBuilder {
    return new OfflineDocumentBuilder(shift).setTestMode(testMode);
}

/**
 * Швидка валідація даних зміни
 * @param shift - Дані зміни для валідації
 * @returns Результат валідації з масивом помилок (якщо є)
 * @example
 * ```typescript
 * const validation = quickValidateShift(shift);
 * if (!validation.isValid) {
 *   console.error('Помилки валідації:', validation.errors);
 * }
 * ```
 */
export function quickValidateShift(shift: ShiftData): ValidationResult {
    const validator = new PRROValidator();
    return validator.validateShift(shift);
}

/**
 * Швидка валідація даних чека
 * @param lines - Товарні позиції
 * @param payment - Дані оплати
 * @returns Результат валідації з масивом помилок (якщо є)
 */
export function quickValidateReceipt(lines: ReceiptLine[], payment: PaymentData): ValidationResult {
    const validator = new PRROValidator();
    return validator.validateReceipt(lines, payment);
}

// Default export для зручності
export default {
    createPRROBuilder,
    createOnlineBuilder,
    createOfflineBuilder,
    createPRROApiClient,
    quickValidateShift,
    quickValidateReceipt,
    PRROBuilder,
    OnlineDocumentBuilder,
    OfflineDocumentBuilder,
    PRROApiClient,
    PRROValidator,
    VERSION,
};
