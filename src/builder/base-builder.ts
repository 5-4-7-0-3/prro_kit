import { ShiftData, ReceiptLine, PaymentData, XMLDocumentResult } from '../core/types';
import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { PRROValidator } from '../validator/validator';
import { BuilderError } from '../errors/errors';

/**
 * Базовий білдер для створення PRRO документів
 */
export class PRROBuilder {
    protected shift: ShiftData;
    protected testing: boolean = false;
    protected validator: PRROValidator;

    /**
     * Створює новий екземпляр білдера
     * @param shift - Дані зміни
     */
    constructor(shift: ShiftData) {
        this.shift = shift;
        this.validator = new PRROValidator();
        
        // Валідуємо дані зміни при створенні
        const validation = this.validator.validateShift(shift);
        if (!validation.isValid) {
            throw new BuilderError(
                `Invalid shift data: ${validation.errors.join(', ')}`,
                'PRROBuilder'
            );
        }
    }

    /**
     * Встановлює режим тестування
     * @param testing - true для тестового режиму
     * @returns this для ланцюгових викликів
     */
    setTestMode(testing: boolean = true): this {
        this.testing = testing;
        return this;
    }

    /**
     * Створює XML документ відкриття зміни
     * @returns Об'єкт з XML документом та UID
     * @example
     * ```typescript
     * const builder = new PRROBuilder(shiftData);
     * const { xml, uid } = builder.buildOpenShift();
     * ```
     */
    buildOpenShift(): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });
        
        const head = {
            DOCTYPE: 100,
            UID: meta.uid,
            TIN: this.shift.tin,
            IPN: this.shift.ipn || '',
            ORGNM: this.shift.orgName,
            POINTNM: this.shift.taxObjectsName,
            POINTADDR: this.shift.address,
            ORDERDATE: meta.date,
            ORDERTIME: meta.time,
            ORDERNUM: this.shift.orderNum,
            CASHDESKNUM: this.shift.numLocal,
            CASHREGISTERNUM: this.shift.numFiscal,
            CASHIER: this.shift.cashier,
            VER: 1,
            ...(this.testing && { TESTING: 1 })
        };

        return {
            xml: buildXml('CHECK', 'CHECKHEAD', head),
            uid: meta.uid
        };
    }

    /**
     * Створює XML документ закриття зміни
     * @returns Об'єкт з XML документом та UID
     * @example
     * ```typescript
     * const builder = new PRROBuilder(shiftData);
     * const { xml, uid } = builder.buildCloseShift();
     * ```
     */
    buildCloseShift(): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });
        
        const head = {
            DOCTYPE: 101,
            UID: meta.uid,
            TIN: this.shift.tin,
            IPN: this.shift.ipn || '',
            ORGNM: this.shift.orgName,
            POINTNM: this.shift.taxObjectsName,
            POINTADDR: this.shift.address,
            ORDERDATE: meta.date,
            ORDERTIME: meta.time,
            ORDERNUM: this.shift.orderNum,
            CASHDESKNUM: this.shift.numLocal,
            CASHREGISTERNUM: this.shift.numFiscal,
            CASHIER: this.shift.cashier,
            VER: 1,
            ...(this.testing && { TESTING: 1 })
        };

        return {
            xml: buildXml('CHECK', 'CHECKHEAD', head),
            uid: meta.uid
        };
    }

    /**
     * Створює XML документ чека продажу
     * @param lines - Масив товарних позицій
     * @param payment - Дані оплати
     * @returns Об'єкт з XML документом та UID
     * @throws {BuilderError} Якщо дані не пройшли валідацію
     * @example
     * ```typescript
     * const lines: ReceiptLine[] = [{
     *     ROWNUM: "1",
     *     CODE: "12345",
     *     NAME: "Хліб",
     *     UNITNM: "шт",
     *     AMOUNT: 2,
     *     PRICE: 25.50,
     *     COST: 51.00
     * }];
     * 
     * const payment: PaymentData = {
     *     method: 'CASH',
     *     amount: 51.00,
     *     provided: 100.00
     * };
     * 
     * const { xml, uid } = builder.buildReceipt(lines, payment);
     * ```
     */
    buildReceipt(lines: ReceiptLine[], payment: PaymentData): XMLDocumentResult {
        // Валідуємо дані чека
        const validation = this.validator.validateReceipt(lines, payment);
        if (!validation.isValid) {
            throw new BuilderError(
                `Invalid receipt data: ${validation.errors.join(', ')}`,
                'PRROBuilder'
            );
        }

        const meta = createMeta({ isTestMode: this.testing });
        const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);
        
        const head = {
            DOCTYPE: 0,
            UID: meta.uid,
            TIN: this.shift.tin,
            IPN: this.shift.ipn || '',
            ORGNM: this.shift.orgName,
            POINTNM: this.shift.taxObjectsName,
            POINTADDR: this.shift.address,
            ORDERDATE: meta.date,
            ORDERTIME: meta.time,
            ORDERNUM: this.shift.orderNum,
            CASHDESKNUM: this.shift.numLocal,
            CASHREGISTERNUM: this.shift.numFiscal,
            CASHIER: this.shift.cashier,
            VER: 1,
            ...(this.testing && { TESTING: 1 })
        };

        const paymentSection = [{
            ROWNUM: '1',
            PAYFORMCD: payment.method === 'CASH' ? 0 : 1,
            PAYFORMNM: payment.method === 'CASH' ? 'ГОТІВКА' : 'КАРТКА',
            SUM: payment.amount.toFixed(2),
            ...(payment.method === 'CASH' && payment.provided && {
                PROVIDED: payment.provided.toFixed(2),
                REMAINS: (payment.provided - payment.amount).toFixed(2)
            })
        }];

        const bodySections = {
            CHECKTOTAL: { SUM: totalAmount.toFixed(2) },
            CHECKPAY: paymentSection,
            CHECKBODY: lines
        };

        return {
            xml: buildXml('CHECK', 'CHECKHEAD', head, bodySections),
            uid: meta.uid
        };
    }

    /**
     * Створює XML документ чека повернення
     * @param lines - Масив товарних позицій для повернення
     * @param payment - Дані повернення коштів
     * @param originalFiscalNumber - Фіскальний номер оригінального чека
     * @returns Об'єкт з XML документом та UID
     * @throws {BuilderError} Якщо дані не пройшли валідацію
     * @example
     * ```typescript
     * const lines: ReceiptLine[] = [{
     *     ROWNUM: "1",
     *     CODE: "12345",
     *     NAME: "Хліб",
     *     UNITNM: "шт",
     *     AMOUNT: 1,
     *     PRICE: 25.50,
     *     COST: 25.50
     * }];
     * 
     * const payment: PaymentData = {
     *     method: 'CASH',
     *     amount: 25.50
     * };
     * 
     * const { xml, uid } = builder.buildRefund(lines, payment, "123456789");
     * ```
     */
    buildRefund(lines: ReceiptLine[], payment: PaymentData, originalFiscalNumber: string): XMLDocumentResult {
        // Валідуємо дані чека
        const validation = this.validator.validateReceipt(lines, payment);
        if (!validation.isValid) {
            throw new BuilderError(
                `Invalid refund data: ${validation.errors.join(', ')}`,
                'PRROBuilder'
            );
        }

        if (!originalFiscalNumber) {
            throw new BuilderError('Original fiscal number is required for refund', 'PRROBuilder');
        }

        const meta = createMeta({ isTestMode: this.testing });
        const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);
        
        const head = {
            DOCTYPE: 0,
            DOCSUBTYPE: 1,
            UID: meta.uid,
            TIN: this.shift.tin,
            IPN: this.shift.ipn || '',
            ORGNM: this.shift.orgName,
            POINTNM: this.shift.taxObjectsName,
            POINTADDR: this.shift.address,
            ORDERDATE: meta.date,
            ORDERTIME: meta.time,
            ORDERNUM: this.shift.orderNum,
            CASHDESKNUM: this.shift.numLocal,
            CASHREGISTERNUM: this.shift.numFiscal,
            ORDERRETNUM: originalFiscalNumber,
            CASHIER: this.shift.cashier,
            VER: 1,
            ...(this.testing && { TESTING: 1 })
        };

        const paymentSection = [{
            ROWNUM: '1',
            PAYFORMCD: payment.method === 'CASH' ? 0 : 1,
            PAYFORMNM: payment.method === 'CASH' ? 'ГОТІВКА' : 'КАРТКА',
            SUM: totalAmount.toFixed(2)
        }];

        const bodySections = {
            CHECKTOTAL: { SUM: totalAmount.toFixed(2) },
            CHECKPAY: paymentSection,
            CHECKBODY: lines
        };

        return {
            xml: buildXml('CHECK', 'CHECKHEAD', head, bodySections),
            uid: meta.uid
        };
    }
}