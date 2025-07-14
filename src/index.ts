import { PRROBuilder, OnlineDocumentBuilder, OfflineDocumentBuilder } from './builder';
import { createPRROApiClient, PRROApiClient } from './client';
import { ShiftData, ValidationResult, ReceiptLine, PaymentData, OfflineSessionData } from './core';
import { createOfflinePackage } from './utils';
import { PRROValidator } from './validator';
import { OfflineValidator } from './validator/offline-validator';

// Core types and constants
export type {
    ShiftData,
    ReceiptLine,
    PaymentData,
    RefundData,
    ZReportData,
    PaymentFormData,
    ValidationResult,
    XMLDocumentResult,
    DocumentType,
    PaymentMethod,
    DocumentSubtype,
    // Offline types
    OfflineSessionData,
    OfflineDocument,
    OfflinePackage,
    ControlNumberData,
    OfflineSessionStats,
    OfflineConfig,
    OfflineValidationResult,
} from './core';

export { OfflineDocumentType } from './core/offline-types';

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

// Validators
export { PRROValidator } from './validator/validator';
export { OfflineValidator } from './validator/offline-validator';

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

// Offline utilities
export {
    sha256,
    calculateControlNumber,
    formatOfflineFiscalNumber,
    parseOfflineFiscalNumber,
    isOfflineFiscalNumber,
    calculateOfflineSessionStats,
    formatDuration,
    createOfflinePackage,
    parseOfflinePackage,
    canContinueOfflineSession,
    getOfflineWarnings,
} from './utils/offlineUtils';

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
 * @param offlineSession - Дані офлайн сесії (опціонально)
 * @param testMode - Увімкнути тестовий режим (за замовчуванням false)
 * @returns Налаштований офлайн білдер
 * @example
 * ```typescript
 * const offlineSession: OfflineSessionData = {
 *   offlineSessionId: 82563,
 *   offlineSeed: 179625192271939,
 *   startTime: new Date()
 * };
 *
 * const builder = createOfflineBuilder(shift, offlineSession);
 *
 * // Початок офлайн сесії
 * const beginOffline = builder.buildOfflineBegin();
 *
 * // Офлайн чек
 * const receipt = builder.buildOfflineReceipt(lines, payment);
 *
 * // Завершення офлайн сесії
 * const endOffline = builder.buildOfflineEnd();
 * ```
 */
export function createOfflineBuilder(
    shift: ShiftData,
    offlineSession?: OfflineSessionData,
    testMode: boolean = false,
): OfflineDocumentBuilder {
    const builder = new OfflineDocumentBuilder(shift, offlineSession);
    return builder.setTestMode(testMode);
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

/**
 * Швидка валідація офлайн сесії
 * @param session - Дані офлайн сесії
 * @returns Результат валідації з масивом помилок та попереджень
 * @example
 * ```typescript
 * const validation = quickValidateOfflineSession(session);
 * if (!validation.isValid) {
 *   console.error('Помилки:', validation.errors);
 * }
 * if (validation.warnings) {
 *   console.warn('Попередження:', validation.warnings);
 * }
 * ```
 */
export function quickValidateOfflineSession(session: OfflineSessionData): ValidationResult {
    const validator = new OfflineValidator();
    const result = validator.validateOfflineSession(session);
    return {
        isValid: result.isValid,
        errors: [...result.errors, ...(result.warnings || [])],
    };
}

/**
 * Створює офлайн пакет для відправки на сервер
 * @param documents - Масив XML документів (рядки)
 * @returns Base64 закодований пакет
 * @example
 * ```typescript
 * const builder = createOfflineBuilder(shift, session);
 * // ... створення документів ...
 *
 * const docs = builder.getOfflineDocuments();
 * const xmlDocs = docs.map(d => d.xml);
 * const packageBase64 = createOfflinePackageBase64(xmlDocs);
 *
 * // Відправка пакету
 * const client = createPRROApiClient();
 * await client.pck(packageBase64);
 * ```
 */
export function createOfflinePackageBase64(documents: string[]): string {
    const base64Docs = documents.map((xml) => Buffer.from(xml).toString('base64'));
    const packageBuffer = createOfflinePackage(base64Docs);
    return packageBuffer.toString('base64');
}

// Default export для зручності
export default {
    // Builders
    createPRROBuilder,
    createOnlineBuilder,
    createOfflineBuilder,

    // API
    createPRROApiClient,

    // Validation
    quickValidateShift,
    quickValidateReceipt,
    quickValidateOfflineSession,

    // Utilities
    createOfflinePackageBase64,

    // Classes
    PRROBuilder,
    OnlineDocumentBuilder,
    OfflineDocumentBuilder,
    PRROApiClient,
    PRROValidator,
    OfflineValidator,
};
