import {
    OfflineSessionData,
    OfflineDocument,
    OfflineValidationResult,
    OfflineSessionStats,
} from '../core/offline-types';
import { isOfflineFiscalNumber, parseOfflineFiscalNumber } from '../utils/offlineUtils';

/**
 * Валідатор для офлайн PRRO документів
 */
export class OfflineValidator {
    /**
     * Валідує дані офлайн сесії
     * @param session - Дані офлайн сесії
     * @returns Результат валідації
     */
    validateOfflineSession(session: OfflineSessionData): OfflineValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Валідація ідентифікатора сесії
        if (!session.offlineSessionId || session.offlineSessionId <= 0) {
            errors.push('Ідентифікатор офлайн сесії повинен бути додатнім числом');
        }

        // Валідація секретного числа
        if (!session.offlineSeed || session.offlineSeed <= 0) {
            errors.push('Секретне число офлайн сесії повинно бути додатнім');
        }

        // Валідація часу початку
        if (session.startTime && !(session.startTime instanceof Date)) {
            errors.push('Час початку сесії повинен бути валідною датою');
        }

        // Валідація тривалості
        if (session.totalDuration !== undefined) {
            if (session.totalDuration < 0) {
                errors.push("Тривалість сесії не може бути від'ємною");
            }

            if (session.totalDuration > 2160) {
                // 36 годин
                errors.push('Тривалість сесії перевищує дозволений ліміт (36 годин)');
            }

            if (session.totalDuration > 1800) {
                // 30 годин - попередження
                warnings.push('Тривалість сесії наближається до ліміту');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    /**
     * Валідує офлайн документ
     * @param document - Офлайн документ
     * @returns Результат валідації
     */
    validateOfflineDocument(document: OfflineDocument): OfflineValidationResult {
        const errors: string[] = [];

        // Валідація типу документа
        if (!document.docType) {
            errors.push("Тип документа обов'язковий");
        }

        // Валідація XML
        if (!document.xml || document.xml.trim().length === 0) {
            errors.push("XML документа обов'язковий");
        }

        // Валідація UID
        if (!document.uid || document.uid.trim().length === 0) {
            errors.push("UID документа обов'язковий");
        }

        // Валідація локального номера
        if (document.localNum <= 0) {
            errors.push('Локальний номер документа повинен бути додатнім');
        }

        // Валідація офлайн локального номера
        if (document.offlineLocalNum <= 0) {
            errors.push('Локальний номер в офлайн сесії повинен бути додатнім');
        }

        // Валідація фіскального номера (якщо є)
        if (document.fiscalNum) {
            if (!isOfflineFiscalNumber(document.fiscalNum)) {
                errors.push('Некоректний формат офлайн фіскального номера');
            } else {
                const parsed = parseOfflineFiscalNumber(document.fiscalNum);
                if (parsed && document.offlineLocalNum !== parsed.localNum) {
                    errors.push('Локальний номер в офлайн сесії не співпадає з номером у фіскальному номері');
                }
            }
        }

        // Валідація контрольного числа
        if (document.controlNumber !== undefined) {
            if (document.controlNumber <= 0 || document.controlNumber > 9999) {
                errors.push('Контрольне число повинно бути від 1 до 9999');
            }
        }

        // Валідація гешів
        if (document.prevDocHash && !/^[a-f0-9]{64}$/i.test(document.prevDocHash)) {
            errors.push('Геш попереднього документа повинен бути 64-символьним hex рядком');
        }

        if (document.docHash && !/^[a-f0-9]{64}$/i.test(document.docHash)) {
            errors.push('Геш документа повинен бути 64-символьним hex рядком');
        }

        // Валідація суми (для чеків)
        if (document.totalAmount !== undefined) {
            if (document.totalAmount < 0) {
                errors.push("Сума документа не може бути від'ємною");
            }
            if (document.totalAmount > 99999999.99) {
                errors.push('Сума документа перевищує максимально дозволену');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Валідує офлайн фіскальний номер
     * @param fiscalNumber - Фіскальний номер для валідації
     * @returns Результат валідації
     */
    validateOfflineFiscalNumber(fiscalNumber: string): OfflineValidationResult {
        const errors: string[] = [];

        if (!fiscalNumber || fiscalNumber.trim().length === 0) {
            errors.push("Фіскальний номер обов'язковий");
            return { isValid: false, errors };
        }

        const parsed = parseOfflineFiscalNumber(fiscalNumber);
        if (!parsed) {
            errors.push('Некоректний формат офлайн фіскального номера (має бути sessionId.localNum.controlNumber)');
            return { isValid: false, errors };
        }

        if (parsed.sessionId <= 0) {
            errors.push('Ідентифікатор сесії повинен бути додатнім числом');
        }

        if (parsed.localNum <= 0) {
            errors.push('Локальний номер повинен бути додатнім числом');
        }

        if (parsed.controlNumber <= 0 || parsed.controlNumber > 9999) {
            errors.push('Контрольне число повинно бути від 1 до 9999');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Валідує статистику офлайн сесії
     * @param stats - Статистика сесії
     * @returns Результат валідації
     */
    validateOfflineSessionStats(stats: OfflineSessionStats): OfflineValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (stats.currentDuration < 0) {
            errors.push("Тривалість сесії не може бути від'ємною");
        }

        if (stats.monthlyDuration < 0) {
            errors.push("Місячна тривалість не може бути від'ємною");
        }

        if (stats.documentsCount < 0) {
            errors.push("Кількість документів не може бути від'ємною");
        }

        if (stats.isOverDailyLimit) {
            errors.push('Перевищено денний ліміт офлайн режиму (36 годин)');
        }

        if (stats.isOverMonthlyLimit) {
            errors.push('Перевищено місячний ліміт офлайн режиму (168 годин)');
        }

        // Попередження
        if (stats.remainingTime < 60 && stats.remainingTime > 0) {
            warnings.push(`До закінчення офлайн режиму залишилось менше години (${stats.remainingTime} хв)`);
        }

        if (stats.currentDuration > 1800) {
            // 30 годин
            warnings.push('Офлайн сесія наближається до денного ліміту');
        }

        if (stats.monthlyDuration > 8400) {
            // 140 годин
            warnings.push('Місячне використання офлайн режиму наближається до ліміту');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    /**
     * Валідує послідовність офлайн документів
     * @param documents - Масив офлайн документів
     * @returns Результат валідації
     */
    validateOfflineDocumentSequence(documents: OfflineDocument[]): OfflineValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (documents.length === 0) {
            warnings.push('Послідовність документів порожня');
            return { isValid: true, errors, warnings };
        }

        // Перевірка початку та кінця сесії
        const hasBegin = documents.some((d) => d.docType === 'OFFLINE_BEGIN');
        const hasEnd = documents.some((d) => d.docType === 'OFFLINE_END');

        if (!hasBegin) {
            errors.push('Відсутній документ початку офлайн сесії');
        }

        if (hasEnd && !hasBegin) {
            errors.push('Документ завершення офлайн сесії без документа початку');
        }

        // Перевірка послідовності локальних номерів
        let prevLocalNum = 0;
        let prevOfflineLocalNum = 0;

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];

            // Локальні номери мають зростати
            if (doc.localNum <= prevLocalNum) {
                errors.push(`Документ ${i + 1}: локальний номер не зростає послідовно`);
            }
            prevLocalNum = doc.localNum;

            // Офлайн локальні номери мають зростати послідовно
            if (doc.offlineLocalNum !== prevOfflineLocalNum + 1) {
                errors.push(`Документ ${i + 1}: офлайн локальний номер не зростає послідовно`);
            }
            prevOfflineLocalNum = doc.offlineLocalNum;

            // Перевірка гешів (крім першого фінансового документа)
            if (i > 0 && doc.docType !== 'OFFLINE_BEGIN' && doc.docType !== 'OFFLINE_END') {
                if (!doc.prevDocHash) {
                    errors.push(`Документ ${i + 1}: відсутній геш попереднього документа`);
                }
            }
        }

        // Перевірка розміру пакету
        if (documents.length > 100) {
            warnings.push('Кількість документів перевищує рекомендований розмір пакету (100)');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
}
