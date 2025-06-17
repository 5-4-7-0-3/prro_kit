import { PRROBuilder } from './base-builder';
import { createMeta, buildXml } from '../utils';
import { ReceiptLine, PaymentData, XMLDocumentResult, DOC_TYPES } from '../core';
import { BuilderError } from '../errors';

/**
 * Білдер для створення офлайн PRRO документів
 * Розширює базовий білдер функціональністю для офлайн режиму
 */
export class OfflineDocumentBuilder extends PRROBuilder {
    /**
     * Створює документ початку офлайн сесії
     * @param revokeLastOnlineDoc - Чи відкликати останній онлайн документ
     * @returns Об'єкт з XML документом та UID
     * @example
     * ```typescript
     * // Звичайний початок офлайн сесії
     * const beginOffline = builder.buildOfflineBegin();
     *
     * // З відкликанням останнього онлайн документа
     * const beginWithRevoke = builder.buildOfflineBegin(true);
     * ```
     */
    buildOfflineBegin(revokeLastOnlineDoc: boolean = false): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });

        const head = {
            DOCTYPE: DOC_TYPES.OFFLINE_BEGIN,
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
            OFFLINE: true,
            ...(revokeLastOnlineDoc && { REVOKELASTONLINEDOC: 'true' }),
            ...(this.testing && { TESTING: 1 }),
        };

        return {
            xml: buildXml('CHECK', 'CHECKHEAD', head),
            uid: meta.uid,
        };
    }

    /**
     * Створює документ завершення офлайн сесії
     * @returns Об'єкт з XML документом та UID
     * @example
     * ```typescript
     * const endOffline = builder.buildOfflineEnd();
     * ```
     */
    buildOfflineEnd(): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });

        const head = {
            DOCTYPE: DOC_TYPES.OFFLINE_END,
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
            OFFLINE: true,
            ...(this.testing && { TESTING: 1 }),
        };

        return {
            xml: buildXml('CHECK', 'CHECKHEAD', head),
            uid: meta.uid,
        };
    }

    /**
     * Створює офлайн чек продажу
     * @param lines - Масив товарних позицій
     * @param payment - Дані оплати
     * @param fiscalNumber - Фіскальний номер офлайн документа
     * @returns Об'єкт з XML документом та UID
     * @throws {BuilderError} Якщо не вказаний фіскальний номер
     * @example
     * ```typescript
     * const lines: ReceiptLine[] = [{
     *     ROWNUM: "1",
     *     CODE: "12345",
     *     NAME: "Товар",
     *     UNITNM: "шт",
     *     AMOUNT: 1,
     *     PRICE: 100.00,
     *     COST: 100.00
     * }];
     *
     * const payment: PaymentData = {
     *     method: 'CASH',
     *     amount: 100.00
     * };
     *
     * const offlineReceipt = builder.buildOfflineReceipt(
     *     lines,
     *     payment,
     *     '82563.25.6127'
     * );
     * ```
     */
    buildOfflineReceipt(lines: ReceiptLine[], payment: PaymentData, fiscalNumber: string): XMLDocumentResult {
        if (!fiscalNumber) {
            throw new BuilderError('Fiscal number is required for offline receipt', 'OfflineDocumentBuilder');
        }

        const receipt = super.buildReceipt(lines, payment);

        const xmlWithOfflineFields = receipt.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE><CASHREGISTERNUM>`,
        );

        return {
            xml: xmlWithOfflineFields,
            uid: receipt.uid,
        };
    }

    /**
     * Створює офлайн чек повернення
     * @param lines - Масив товарних позицій для повернення
     * @param payment - Дані повернення коштів
     * @param originalFiscalNumber - Фіскальний номер оригінального чека
     * @param offlineFiscalNumber - Фіскальний номер офлайн документа
     * @returns Об'єкт з XML документом та UID
     * @throws {BuilderError} Якщо не вказані необхідні номери
     * @example
     * ```typescript
     * const refund = builder.buildOfflineRefund(
     *     lines,
     *     payment,
     *     '123456789',    // оригінальний чек
     *     '82563.26.1234' // офлайн номер
     * );
     * ```
     */
    buildOfflineRefund(
        lines: ReceiptLine[],
        payment: PaymentData,
        originalFiscalNumber: string,
        offlineFiscalNumber: string,
    ): XMLDocumentResult {
        if (!offlineFiscalNumber) {
            throw new BuilderError('Offline fiscal number is required for offline refund', 'OfflineDocumentBuilder');
        }

        const refund = super.buildRefund(lines, payment, originalFiscalNumber);

        const xmlWithOfflineFields = refund.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${offlineFiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE><CASHREGISTERNUM>`,
        );

        return {
            xml: xmlWithOfflineFields,
            uid: refund.uid,
        };
    }
}
