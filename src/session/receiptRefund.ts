import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { MetaData, DocType, RefundParams } from '../types';

/**
 * Параметри для створення чеку повернення
 * @property {'CASH' | 'CARD'} receiptType - Тип оплати
 * @property {string} fiscalizationNumber - Фіскальний номер оригінального чеку
 * @property {number} totalAmount - Сума повернення
 * @property {ReceiptLine[]} lines - Позиції чеку
 * @property {ShiftData} shift - Дані зміни
 */

/**
 * Генерує XML для чеку повернення
 * @param {RefundParams} opts - Параметри генерації
 * @returns {Object} Об'єкт з XML та UUID документа
 */
export function buildRefundReceiptXml(opts: RefundParams): { xml: string; uid: string } {
    const { receiptType, fiscalizationNumber, totalAmount, lines, shift, ...metaOpts } = opts;

    if (!shift.orderNum) throw new Error("Параметр orderNum обов'язковий");

    const meta: MetaData = createMeta(metaOpts);
    const head = {
        DOCTYPE: DocType.Receipt,
        DOCSUBTYPE: 1,
        UID: meta.uid,
        TIN: shift.tin,
        IPN: shift.ipn || '',
        ORGNM: shift.orgName,
        POINTNM: shift.taxObjectsName,
        POINTADDR: shift.address,
        ORDERDATE: meta.date,
        ORDERTIME: meta.time,
        ORDERNUM: shift.orderNum,
        CASHDESKNUM: shift.numLocal,
        CASHREGISTERNUM: shift.numFiscal,
        ORDERRETNUM: fiscalizationNumber,
        CASHIER: shift.cashier,
        VER: 1,
        ...(meta.testing && { TESTING: 1 }),
    };

    const paymentSection = [
        {
            ROWNUM: '1',
            PAYFORMCD: receiptType === 'CASH' ? 0 : 1,
            PAYFORMNM: receiptType === 'CASH' ? 'ГОТІВКА' : 'КАРТА',
            SUM: totalAmount.toFixed(2),
        },
    ];

    const bodySections = {
        CHECKTOTAL: { SUM: totalAmount.toFixed(2) },
        CHECKPAY: paymentSection,
        CHECKBODY: lines,
    };

    return {
        xml: buildXml('CHECK', 'CHECKHEAD', head, bodySections),
        uid: meta.uid,
    };
}
