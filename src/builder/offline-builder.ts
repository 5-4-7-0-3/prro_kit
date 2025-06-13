import { PRROBuilder } from './base-builder';
import { createMeta, buildXml } from '../utils';
import { ReceiptLine, PaymentData } from '../core';

export class OfflineDocumentBuilder extends PRROBuilder {
    buildOfflineBegin(revokeLastOnlineDoc: boolean = false): { xml: string; uid: string } {
        const meta = createMeta({ isTestMode: this.testing });

        const head = {
            DOCTYPE: 102,
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

    buildOfflineEnd(): { xml: string; uid: string } {
        const meta = createMeta({ isTestMode: this.testing });

        const head = {
            DOCTYPE: 103,
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

    buildOfflineReceipt(
        lines: ReceiptLine[],
        payment: PaymentData,
        fiscalNumber: string,
    ): { xml: string; uid: string } {
        const receipt = super.buildReceipt(lines, payment);

        // Додаємо офлайн специфічні поля
        const xmlWithOfflineFields = receipt.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE><CASHREGISTERNUM>`,
        );

        return {
            xml: xmlWithOfflineFields,
            uid: receipt.uid,
        };
    }
}
