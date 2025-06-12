/**
 * Базовий тип для рядка XML
 */
export interface Row {
    ROWNUM: string;
    [key: string]: string | number | boolean;
}

/**
 * Типи фіскальних документів
 */
export enum DocType {
    Receipt = 0,
    OpenShift = 100,
    CloseShift = 101,
    OfflineStart = 102,
    OfflineEnd = 103,
    ZReport = 104,
    RefundReceipt = 109,
}

/**
 * Метадані документа
 */
export interface MetaData {
    uid: string;
    date: string;
    time: string;
    testing: boolean;
}

/**
 * Опції генерації метаданих
 */
export interface CreateMetaOptions {
    isTestMode?: boolean;
    uuidFn?: () => string;
    isoString?: string;
    timeZone?: string;
}

/**
 * Дані каси та організації
 */
export interface ShiftData {
    tin: string;
    orgName: string;
    taxObjectsName: string;
    address: string;
    orderNum: string;
    numLocal: string;
    numFiscal: string;
    cashier: string;
    ipn?: string;
}

/**
 * Позиція в чеку
 */
export interface ReceiptLine extends Row {
    CODE: string;
    NAME: string;
    UNITNM: string;
    AMOUNT: number;
    PRICE: number;
    COST: number;
}

/**
 * Форма оплати для Z-звіту
 */
export interface PayForm extends Row {
    PAYFORMCD: number;
    PAYFORMNM: string;
    SUM: string;
}

/**
 * Параметри для відкриття зміни
 */
export interface OpenShiftParams extends CreateMetaOptions {
    shift: ShiftData;
}

/**
 * Параметри для закриття зміни
 */
export interface CloseShiftParams extends CreateMetaOptions {
    shift: ShiftData;
}

/**
 * Параметри для створення чеку продажу
 */
export interface ReceiptParams extends CreateMetaOptions {
    receiptType: 'CASH' | 'CARD';
    totalAmount: number;
    providedCash?: number;
    lines: ReceiptLine[];
    shift: ShiftData;
}

/**
 * Параметри для створення чеку повернення
 */
export interface RefundParams extends CreateMetaOptions {
    receiptType: 'CASH' | 'CARD';
    fiscalizationNumber: string;
    totalAmount: number;
    lines: ReceiptLine[];
    shift: ShiftData;
}

/**
 * Параметри для Z-звіту
 */
export interface ZReportParams extends CreateMetaOptions {
    shift: ShiftData;
    payment: {
        cashSum: number;
        cardSum: number;
        totalAmount: number;
        totalReceipts: number;
    };
    refund?: {
        cashSum: number;
        cardSum: number;
        totalAmount: number;
        totalReceipts: number;
    };
}

/**
 * Параметри для OfflineBegin
 */
export interface OfflineBeginParams extends CreateMetaOptions {
    shift: ShiftData;
    revokeLastOnlineDoc?: boolean;
}

/**
 * Параметри для OfflineEnd
 */
export interface OfflineEndParams extends CreateMetaOptions {
    shift: ShiftData;
}
