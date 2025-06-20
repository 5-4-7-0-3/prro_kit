import { PRROBuilder } from './base-builder';
import { createMeta } from '../utils';
import { buildXml } from '../utils';
import { ZReportData, XMLDocumentResult } from '../core/types';

/**
 * Білдер для створення онлайн PRRO документів
 * Розширює базовий білдер додатковою функціональністю для онлайн режиму
 */
export class OnlineDocumentBuilder extends PRROBuilder {
    /**
     * Створює Z-звіт для онлайн режиму
     * @param data - Дані для Z-звіту
     * @returns Об'єкт з XML документом та UID
     * @example
     */
    buildZReport(data: ZReportData): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });

        const head = {
            UID: meta.uid,
            TIN: this.shift.tin,
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
            ...(this.testing && { TESTING: 1 }),
        };

        const realizPayforms = data.paymentForms?.map((form, index) => ({
            ROWNUM: (index + 1).toString(),
            PAYFORMCD: form.payFormCode,
            PAYFORMNM: form.payFormName,
            SUM: form.sum.toFixed(2),
        }));

        const realizSection = {
            SUM: data.totalSales.toFixed(2),
            ORDERSCNT: data.salesCount,
            ...(realizPayforms && realizPayforms.length > 0 && { PAYFORMS: realizPayforms }),
        };

        const refundPayforms = data.refundPaymentForms?.map((form, index) => ({
            ROWNUM: (index + 1).toString(),
            PAYFORMCD: form.payFormCode,
            PAYFORMNM: form.payFormName,
            SUM: form.sum.toFixed(2),
        }));

        const returnSection =
            data.totalRefunds > 0
                ? {
                      SUM: data.totalRefunds.toFixed(2),
                      ORDERSCNT: data.refundsCount,
                      ...(refundPayforms && refundPayforms.length > 0 && { PAYFORMS: refundPayforms }),
                  }
                : undefined;

        const bodySection = {
            SERVICEINPUT: (data.serviceInput || 0).toFixed(2),
            SERVICEOUTPUT: (data.serviceOutput || 0).toFixed(2),
        };

        const bodySections = {
            ZREPREALIZ: realizSection,
            ...(returnSection && { ZREPRETURN: returnSection }),
            ZREPBODY: bodySection,
        };

        return {
            xml: buildXml('ZREP', 'ZREPHEAD', head, bodySections),
            uid: meta.uid,
        };
    }
}
