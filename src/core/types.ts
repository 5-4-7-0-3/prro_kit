/**
 * Дані зміни для PRRO
 */
export interface ShiftData {
    /** ЄДРПОУ/ДРФО/№ паспорта продавця (10 символів) */
    tin: string;
    /** Найменування продавця (до 256 символів) */
    orgName: string;
    /** Найменування точки продажу (до 256 символів) */
    taxObjectsName: string;
    /** Адреса точки продажу (до 256 символів) */
    address: string;
    /** Локальний номер документа (до 128 символів) */
    orderNum: number;
    /** Локальний номер реєстратора розрахункових операцій (до 64 символів) */
    numLocal: string | number;
    /** Фіскальний номер реєстратора розрахункових операцій (до 128 символів) */
    numFiscal: string;
    /** ПІБ касира (до 128 символів) */
    cashier: string;
    /** Податковий номер або ІПН (12 символів, опціонально) */
    ipn?: string;
}

/**
 * Рядок чека/товарна позиція
 */
export interface ReceiptLine {
    /** Порядковий номер рядка */
    ROWNUM: string;
    /** Внутрішній код товару (до 64 символів) */
    CODE: string;
    /** Найменування товару, послуги або операції */
    NAME: string;
    /** Найменування одиниці виміру (кг, шт, л тощо) */
    UNITNM: string;
    /** Кількість/об'єм товару (до 15.3 цифр) */
    AMOUNT: number;
    /** Ціна за одиницю товару (до 15.2 цифр) */
    PRICE: number;
    /** Сума операції (до 15.2 цифр) */
    COST: number;
    /** Код товару згідно з УКТЗЕД (15 цифр, опціонально) */
    UKTZED?: string;
    /** Літерні позначення видів і ставок податків/зборів */
    LETTERS?: string;
}

/**
 * Дані платежу
 */
export interface PaymentData {
    /** Метод оплати: готівка або картка */
    method: 'CASH' | 'CARD';
    /** Сума до оплати */
    amount: number;
    /** Сума внесених коштів (для готівки) */
    provided?: number;
}

/**
 * Результат валідації
 */
export interface ValidationResult {
    /** Чи пройшла валідація успішно */
    isValid: boolean;
    /** Масив помилок валідації */
    errors: string[];
}

/**
 * Результат генерації XML документа
 */
export interface XMLDocumentResult {
    /** Згенерований XML документ */
    xml: string;
    /** Унікальний ідентифікатор документа */
    uid: string;
}

/**
 * Дані для повернення товару
 */
export interface RefundData {
    /** Рядки повернення */
    lines: ReceiptLine[];
    /** Дані платежу для повернення */
    payment: PaymentData;
    /** Фіскальний номер оригінального чека */
    originalFiscalNumber: string;
}

/**
 * Дані про форму оплати для Z-звіту
 */
export interface PaymentFormData {
    /** Код форми оплати (0 - готівка, 1 - картка) */
    payFormCode: number;
    /** Назва форми оплати */
    payFormName: string;
    /** Сума по формі оплати */
    sum: number;
}

export interface TaxData {
    type: number; // Тип податку (0 - ПДВ, 1 - акциз, тощо)
    name: string; // Назва податку
    letter: string; // Літера податку (А, Б, В, Г, Д)
    rate: number; // Ставка податку у відсотках
    turnover: number; // Оборот по податку
    sum: number; // Сума податку
}

/**
 * Дані для Z-звіту
 */
export interface ZReportData {
    totalSales: number; // Загальна сума продажів
    salesCount: number; // Кількість продажів
    totalRefunds: number; // Загальна сума повернень
    refundsCount: number; // Кількість повернень
    serviceInput?: number; // Службове внесення
    serviceOutput?: number; // Службове винесення
    paymentForms?: PaymentFormData[]; // Форми оплати для продажів
    taxes?: TaxData[]; // Податки для продажів
    refundPaymentForms?: PaymentFormData[]; // Форми оплати для повернень
    refundTaxes?: TaxData[]; // Податки для повернень
}

/**
 * Типи документів PRRO
 */
export type DocumentType =
    | 'RECEIPT' // Чек реалізації
    | 'REFUND' // Чек повернення
    | 'OPEN_SHIFT' // Відкриття зміни
    | 'CLOSE_SHIFT' // Закриття зміни
    | 'OFFLINE_BEGIN' // Початок офлайн сесії
    | 'OFFLINE_END' // Завершення офлайн сесії
    | 'Z_REPORT'; // Z-звіт

/**
 * Методи оплати
 */
export type PaymentMethod = 'CASH' | 'CARD';

/**
 * Підтипи документів
 */
export type DocumentSubtype =
    | 'SALE' // Продаж
    | 'RETURN' // Повернення
    | 'SERVICE_INPUT' // Службове внесення
    | 'SERVICE_OUTPUT' // Службова видача
    | 'CANCEL'; // Сторно
