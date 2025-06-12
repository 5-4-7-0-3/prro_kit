import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { DocType, PayForm, ZReportParams } from '../types';

/**
 * Параметри для Z-звіту
 * @property {ShiftData} shift - Дані зміни
 * @property {Object} payment - Дані про продажі
 * @property {number} payment.cashSum - Сума готівкових оплат
 * @property {number} payment.cardSum - Сума безготівкових оплат
 * @property {number} payment.totalAmount - Загальна сума
 * @property {number} payment.totalReceipts - Кількість чеків
 * @property {Object} [refund] - Дані про повернення
 */

/**
 * Генерує XML для Z-звіту
 * @param {ZReportParams} opts - Параметри генерації
 * @returns {Object} Об'єкт з XML та UUID документа
 */
export function buildZReportXml(opts: ZReportParams): { xml: string; uid: string } {
    const { shift, payment, refund, ...metaOpts } = opts;
    if (!shift.orderNum) throw new Error("Параметр orderNum обов'язковий");

    const meta = createMeta(metaOpts);
    const head = {
        DOCTYPE: DocType.ZReport,
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

    const createPayForms = (cash: number, card: number): PayForm[] => {
        const forms: PayForm[] = [];
        if (cash > 0)
            forms.push({
                ROWNUM: '1',
                PAYFORMCD: 0,
                PAYFORMNM: 'ГОТІВКА',
                SUM: cash.toFixed(2),
            });
        if (card > 0)
            forms.push({
                ROWNUM: '2',
                PAYFORMCD: 1,
                PAYFORMNM: 'КАРТА',
                SUM: card.toFixed(2),
            });
        return forms;
    };

    const body: Record<string, any> = {
        ZREPREALIZ: {
            SUM: payment.totalAmount.toFixed(2),
            ORDERSCNT: payment.totalReceipts,
            PAYFORMS: createPayForms(payment.cashSum, payment.cardSum),
        },
    };

    if (refund && refund.totalReceipts > 0) {
        body.ZREPRETURN = {
            SUM: refund.totalAmount.toFixed(2),
            ORDERSCNT: refund.totalReceipts,
            PAYFORMS: createPayForms(refund.cashSum, refund.cardSum),
        };
    }

    return {
        xml: buildXml('ZREP', 'ZREPHEAD', head, body),
        uid: meta.uid,
    };
}
