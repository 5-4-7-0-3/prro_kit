import { PRROBuilder } from './base-builder';
import { createMeta, buildXml } from '../utils';
import { PaymentData, ReceiptLine } from '../core';

export class OnlineDocumentBuilder extends PRROBuilder {
    buildOpenShift(): { xml: string; uid: string } {
        return super.buildOpenShift();
    }

    buildCloseShift(): { xml: string; uid: string } {
        return super.buildCloseShift();
    }

    buildReceipt(lines: ReceiptLine[], payment: PaymentData): { xml: string; uid: string } {
        return super.buildReceipt(lines, payment);
    }

    buildZReport(totals: any): { xml: string; uid: string } {
        // Z-звіт для онлайн режиму
        const meta = createMeta({ isTestMode: this.testing });

        const head = {
            DOCTYPE: 104,
            UID: meta.uid,
            TIN: this.shift.tin,
            // ... інші поля
        };

        return {
            xml: buildXml('ZREP', 'ZREPHEAD', head, totals),
            uid: meta.uid,
        };
    }
}
