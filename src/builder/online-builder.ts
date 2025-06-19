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
     * ```typescript
     * const zReportData: ZReportData = {
     *   totalSales: 5000.00,
     *   totalRefunds: 250.00,
     *   salesCount: 25,
     *   refundsCount: 2,
     *   serviceInput: 1000.00,
     *   serviceOutput: 500.00
     * };
     *
     * const zReport = builder.buildZReport(zReportData);
     * ```
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

        const realizSection = {
            SUM: data.totalSales.toFixed(2),
            ORDERSCNT: data.salesCount,
        };

        const returnSection =
            data.totalRefunds > 0
                ? {
                      SUM: data.totalRefunds.toFixed(2),
                      ORDERSCNT: data.refundsCount,
                  }
                : undefined;

        const bodySection = {
            SERVICEINPUT: data.serviceInput?.toFixed(2),
            SERVICEOUTPUT: data.serviceOutput?.toFixed(2),
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
