declare module 'robol_prro_kit' {
    // Основні типи даних
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

    export interface ReceiptLine {
        ROWNUM: string;
        CODE: string;
        NAME: string;
        UNITNM: string;
        AMOUNT: number;
        PRICE: number;
        COST: number;
        UKTZED?: string;
        LETTERS?: string;
    }

    export interface PaymentData {
        method: 'CASH' | 'CARD';
        amount: number;
        provided?: number;
    }

    export interface ValidationResult {
        isValid: boolean;
        errors: string[];
    }

    export interface XMLDocumentResult {
        xml: string;
        uid: string;
    }

    export interface ZReportData {
        totalSales: number;
        totalRefunds: number;
        salesCount: number;
        refundsCount: number;
        serviceInput?: number;
        serviceOutput?: number;
    }

    // Класи
    export class PRROBuilder {
        constructor(shift: ShiftData);
        setTestMode(testing?: boolean): this;
        buildOpenShift(): XMLDocumentResult;
        buildCloseShift(): XMLDocumentResult;
        buildReceipt(lines: ReceiptLine[], payment: PaymentData): XMLDocumentResult;
        buildRefund(lines: ReceiptLine[], payment: PaymentData, originalFiscalNumber: string): XMLDocumentResult;
    }

    export class OnlineDocumentBuilder extends PRROBuilder {
        buildZReport(data: ZReportData): XMLDocumentResult;
    }

    export class OfflineDocumentBuilder extends PRROBuilder {
        buildOfflineBegin(revokeLastOnlineDoc?: boolean): XMLDocumentResult;
        buildOfflineEnd(): XMLDocumentResult;
        buildOfflineReceipt(lines: ReceiptLine[], payment: PaymentData, fiscalNumber: string): XMLDocumentResult;
        buildOfflineRefund(
            lines: ReceiptLine[],
            payment: PaymentData,
            originalFiscalNumber: string,
            offlineFiscalNumber: string,
        ): XMLDocumentResult;
    }

    export class PRROValidator {
        validateShift(shift: ShiftData): ValidationResult;
        validateReceipt(lines: ReceiptLine[], payment: PaymentData): ValidationResult;
        validateFiscalNumber(fiscalNumber: string): boolean;
        validateAmount(amount: number): boolean;
    }

    // API Client
    export class PRROApiClient {
        constructor(baseUrl?: string);
        doc(base64Document: string): Promise<any>;
        cmd<T = any>(base64Command: string): Promise<T>;
        pck<T = any>(base64Package: string): Promise<T>;
    }

    // Функції фабрики
    export function createPRROBuilder(shift: ShiftData, testMode?: boolean): PRROBuilder;
    export function createOnlineBuilder(shift: ShiftData, testMode?: boolean): OnlineDocumentBuilder;
    export function createOfflineBuilder(shift: ShiftData, testMode?: boolean): OfflineDocumentBuilder;
    export function createPRROApiClient(baseUrl?: string): PRROApiClient;
    export function quickValidateShift(shift: ShiftData): ValidationResult;
    export function quickValidateReceipt(lines: ReceiptLine[], payment: PaymentData): ValidationResult;

    // Константи
    export const VERSION: string;
    export const PRRO_CONSTANTS: {
        DOC_TYPES: Record<string, number>;
        DOC_SUBTYPES: Record<string, number>;
        PAYMENT_TYPES: Record<string, number>;
    };

    // Утиліти
    export function getCurrentPRRODate(): string;
    export function getCurrentPRROTime(): string;
    export function formatAmount(amount: number): string;
    export function formatQuantity(quantity: number): string;
    export function isValidTIN(tin: string): boolean;
    export function isValidAmount(amount: number): boolean;
    export function isValidQuantity(quantity: number): boolean;
    export function sanitizeXMLString(str: string): string;

    // Помилки
    export class PRROError extends Error {
        code?: string;
        details?: any;
    }

    export class ValidationError extends PRROError {
        validationErrors: string[];
    }

    export class XMLError extends PRROError {}
    export class BuilderError extends PRROError {}
}
