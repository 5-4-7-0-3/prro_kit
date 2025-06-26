/**
 * Типи даних для офлайн режиму PRRO
 */

/**
 * Дані офлайн сесії
 */
export interface OfflineSessionData {
    /** Ідентифікатор офлайн сесії */
    offlineSessionId: string;
    /** Секретне число для обчислення фіскального номера */
    offlineSeed: string;
    /** Початок офлайн сесії */
    startTime?: Date;
    /** Кінець офлайн сесії */
    endTime?: Date;
    /** Загальна тривалість офлайн сесії в хвилинах */
    totalDuration?: number;
    /** Наступний локальний номер в офлайн сесії */
    nextLocalNum?: number;
    /** Ознака відкликання останнього онлайн документа */
    revokeLastOnlineDoc?: boolean;
}

/**
 * Офлайн документ
 */
export interface OfflineDocument {
    /** Тип документа */
    docType: OfflineDocumentType;
    /** XML документа */
    xml: string;
    /** UID документа */
    uid: string;
    /** Локальний номер документа */
    localNum: number;
    /** Локальний номер в офлайн сесії */
    offlineLocalNum: number;
    /** Фіскальний номер офлайн документа */
    fiscalNum?: string;
    /** Контрольне число */
    controlNumber?: number;
    /** Геш попереднього документа */
    prevDocHash?: string;
    /** Геш поточного документа */
    docHash?: string;
    /** Дата створення */
    createdAt: Date;
    /** Загальна сума (для чеків) */
    totalAmount?: number;
}

/**
 * Типи офлайн документів
 */
export enum OfflineDocumentType {
    /** Початок офлайн сесії */
    OFFLINE_BEGIN = 'OFFLINE_BEGIN',
    /** Кінець офлайн сесії */
    OFFLINE_END = 'OFFLINE_END',
    /** Чек */
    CHECK = 'CHECK',
    /** Z-звіт */
    Z_REPORT = 'Z_REPORT',
    /** Чек повернення */
    RETURN_CHECK = 'RETURN_CHECK',
    /** Закриття зміни */
    CLOSE_SHIFT = 'CLOSE_SHIFT',
}

/**
 * Пакет офлайн документів
 */
export interface OfflinePackage {
    /** Масив офлайн документів */
    documents: OfflineDocument[];
    /** Ідентифікатор офлайн сесії */
    sessionId: string;
    /** Загальний розмір пакету в байтах */
    size?: number;
    /** Дата створення пакету */
    createdAt: Date;
}

/**
 * Дані для розрахунку контрольного числа
 */
export interface ControlNumberData {
    /** Секретне число */
    offlineSeed: string;
    /** Дата документа (ДДММРРРР) */
    date: string;
    /** Час документа (ГГХХСС) */
    time: string;
    /** Локальний номер документа */
    localNum: number;
    /** Фіскальний номер реєстратора */
    fiscalNum: string;
    /** Локальний номер реєстратора */
    localRegNum: string;
    /** Загальна сума (для чеків) */
    totalAmount?: number;
    /** Геш попереднього документа */
    prevDocHash?: string;
}

/**
 * Статистика офлайн сесії
 */
export interface OfflineSessionStats {
    /** Ідентифікатор сесії */
    sessionId: string;
    /** Тривалість поточної сесії в хвилинах */
    currentDuration: number;
    /** Загальна тривалість за місяць в хвилинах */
    monthlyDuration: number;
    /** Кількість документів в сесії */
    documentsCount: number;
    /** Чи перевищений ліміт 36 годин */
    isOverDailyLimit: boolean;
    /** Чи перевищений ліміт 168 годин за місяць */
    isOverMonthlyLimit: boolean;
    /** Залишок часу до ліміту (хвилини) */
    remainingTime: number;
}

/**
 * Конфігурація офлайн режиму
 */
export interface OfflineConfig {
    /** Максимальна тривалість сесії (36 годин = 2160 хвилин) */
    maxSessionDuration: number;
    /** Максимальна тривалість за місяць (168 годин = 10080 хвилин) */
    maxMonthlyDuration: number;
    /** Максимальна кількість документів в пакеті */
    maxPackageSize: number;
    /** Інтервал перевірки зв'язку (мілісекунди) */
    connectionCheckInterval: number;
    /** Автоматично відправляти пакети при відновленні зв'язку */
    autoSendOnReconnect: boolean;
}

/**
 * Результат валідації офлайн документа
 */
export interface OfflineValidationResult {
    /** Чи валідний документ */
    isValid: boolean;
    /** Помилки валідації */
    errors: string[];
    /** Попередження */
    warnings?: string[];
}
