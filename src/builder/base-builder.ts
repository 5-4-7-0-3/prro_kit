import { ShiftData, ReceiptLine, PaymentData } from '../core/types';
import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';

export class PRROBuilder {
    protected shift: ShiftData;
    protected testing: boolean = false;

    constructor(shift: ShiftData) {
        this.shift = shift;
    }

    setTestMode(testing: boolean = true): this {
        this.testing = testing;
        return this;
    }

    // Відкриття зміни
    buildOpenShift(): { xml: string; uid: string } {
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

    // Закриття зміни
    buildCloseShift(): { xml: string; uid: string } {
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

    // Чек продажу
    buildReceipt(lines: ReceiptLine[], payment: PaymentData): { xml: string; uid: string } {
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
            PAYFORMNM: payment.method === 'CASH' ? 'ГОТІВКА' : 'КАРТА',
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

    // Чек повернення
    buildRefund(lines: ReceiptLine[], payment: PaymentData, originalFiscalNumber: string): { xml: string; uid: string } {
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
            PAYFORMNM: payment.method === 'CASH' ? 'ГОТІВКА' : 'КАРТА',
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