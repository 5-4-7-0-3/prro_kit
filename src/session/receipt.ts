import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { MetaData, DocType, ReceiptParams } from '../types';

/**
 * Параметри для створення чеку продажу
 * @property {'CASH' | 'CARD'} receiptType - Тип оплати
 * @property {number} totalAmount - Загальна сума
 * @property {number} [providedCash] - Сума від клієнта (для готівки)
 * @property {ReceiptLine[]} lines - Позиції чеку
 * @property {ShiftData} shift - Дані зміни
 */

/**
 * Генерує XML для чеку продажу
 * @param {ReceiptParams} opts - Параметри генерації
 * @returns {Object} Об'єкт з XML та UUID документа
 */
export function buildReceiptXml(opts: ReceiptParams): { xml: string; uid: string } {
    const { receiptType, totalAmount, providedCash = 0, lines, shift, ...metaOpts } = opts;
    if (!shift.orderNum) throw new Error("Параметр orderNum обов'язковий");

    const meta: MetaData = createMeta(metaOpts);
    const head = {
        DOCTYPE: DocType.Receipt,
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
            ...(receiptType === 'CASH' && {
                PROVIDED: providedCash.toFixed(2),
                REMAINS: (providedCash - totalAmount).toFixed(2),
            }),
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
