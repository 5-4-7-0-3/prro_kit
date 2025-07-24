import { PRROBuilder } from './base-builder';
import { createMeta, buildXml } from '../utils';
import { ReceiptLine, PaymentData, XMLDocumentResult, DOC_TYPES, ShiftData, ZReportData } from '../core';
import { BuilderError } from '../errors';
import {
    OfflineSessionData,
    OfflineDocument,
    OfflineDocumentType,
    OfflinePackage,
    ControlNumberData,
} from '../core/offline-types';
import {
    calculateControlNumber,
    formatOfflineFiscalNumber,
    sha256,
    createOfflinePackage,
    calculateOfflineSessionStats,
    canContinueOfflineSession,
} from '../utils/offlineUtils';

/**
 * Білдер для створення офлайн PRRO документів
 * Розширює базовий білдер функціональністю для офлайн режиму
 */
export class OfflineDocumentBuilder extends PRROBuilder {
    private offlineSession?: OfflineSessionData;
    private offlineDocuments: OfflineDocument[] = [];

    constructor(shift: ShiftData, offlineSession?: OfflineSessionData, isTestMode: boolean = false) {
        super(shift);
        this.offlineSession = offlineSession;
        this.setTestMode(isTestMode);
    }

    setOfflineSession(session: OfflineSessionData): this {
        this.offlineSession = session;
        return this;
    }

    getOfflineSession(): OfflineSessionData | undefined {
        return this.offlineSession;
    }

    buildOfflineBegin(revokeLastOnlineDoc: boolean = false): XMLDocumentResult {
        const meta = createMeta();

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession!.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: this.shift.orderNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession!.offlineSessionId,
            this.offlineSession!.nextLocalNum!,
            controlNumber,
        );
        const head = {
            DOCTYPE: DOC_TYPES.OFFLINE_BEGIN,
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
            REVOKELASTONLINEDOC: revokeLastOnlineDoc ? 'true' : 'false',
            CASHIER: this.shift.cashier,
            VER: 1,
            ORDERTAXNUM: fiscalNumber,
            OFFLINE: true,
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OFFLINE_BEGIN,
            xml,
            uid: meta.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum: this.offlineSession!.nextLocalNum!,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);

        return { xml, uid: meta.uid };
    }

    buildOfflineEnd(prevDocHash?: string): XMLDocumentResult {
        const meta = createMeta();

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession!.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: this.shift.orderNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            prevDocHash,
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession!.offlineSessionId,
            this.offlineSession!.nextLocalNum!,
            controlNumber,
        );
        const head = {
            DOCTYPE: DOC_TYPES.OFFLINE_END,
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
            ORDERTAXNUM: fiscalNumber,
            OFFLINE: true,
            PREVDOCHASH: prevDocHash,
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OFFLINE_END,
            xml,
            uid: meta.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum: this.offlineSession!.nextLocalNum!,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);
        return { xml, uid: meta.uid };
    }

    buildOfflineOpenTillShift(prevDocHash?: string): XMLDocumentResult {
        const meta = createMeta();

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession!.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: this.shift.orderNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            prevDocHash,
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession!.offlineSessionId,
            this.offlineSession!.nextLocalNum!,
            controlNumber,
        );
        const head = {
            DOCTYPE: DOC_TYPES.OPEN_SHIFT,
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
            ORDERTAXNUM: fiscalNumber,
            OFFLINE: true,
            ...(this.testing && { TESTING: true }),
            PREVDOCHASH: prevDocHash,
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        const docHash = sha256(xml);
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OPEN_SHIFT,
            xml,
            uid: meta.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum: this.offlineSession!.nextLocalNum!,
            createdAt: new Date(),
            docHash,
        };

        this.offlineDocuments.push(offlineDoc);
        return { xml, uid: meta.uid };
    }

    buildOfflineCloseTillShift(prevDocHash?: string): XMLDocumentResult {
        const meta = createMeta();

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession!.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: this.shift.orderNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            prevDocHash,
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession!.offlineSessionId,
            this.offlineSession!.nextLocalNum!,
            controlNumber,
        );
        const head = {
            DOCTYPE: DOC_TYPES.CLOSE_SHIFT,
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
            ORDERTAXNUM: fiscalNumber,
            OFFLINE: true,
            PREVDOCHASH: prevDocHash,
            ...(this.testing && { TESTING: true }),
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);
        const docHash = sha256(xml);
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.CLOSE_SHIFT,
            xml,
            uid: meta.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum: this.offlineSession!.nextLocalNum!,
            createdAt: new Date(),
            docHash,
        };

        this.offlineDocuments.push(offlineDoc);
        return { xml, uid: meta.uid };
    }

    buildOfflineReceiptDocument(
        lines: ReceiptLine[],
        payment: PaymentData,
        options: {
            isRefund?: boolean;
            originalFiscalNumber?: string;
            localNum?: number;
            prevDocHash?: string;
        } = {},
    ): XMLDocumentResult {
        const { isRefund = false, originalFiscalNumber, localNum, prevDocHash } = options;

        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline document', 'OfflineDocumentBuilder');
        }

        if (isRefund && !originalFiscalNumber) {
            throw new BuilderError('Original fiscal number is required for refund', 'OfflineDocumentBuilder');
        }

        const stats = calculateOfflineSessionStats(
            this.offlineSession.startTime || new Date(),
            0,
            this.offlineDocuments.length,
        );

        if (!canContinueOfflineSession(stats)) {
            throw new BuilderError('Offline session time limit exceeded', 'OfflineDocumentBuilder');
        }

        const meta = createMeta();
        const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: this.shift.orderNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            totalAmount,
            prevDocHash,
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession.offlineSessionId,
            this.offlineSession!.nextLocalNum!,
            controlNumber,
        );

        let documentResult: XMLDocumentResult;
        if (isRefund) {
            documentResult = super.buildRefund(lines, payment, originalFiscalNumber!);
        } else {
            documentResult = super.buildReceipt(lines, payment);
        }

        const xmlWithOfflineFields = documentResult.xml.replace(
            '<VER>1</VER>',
            `<VER>1</VER><ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (prevDocHash ? `<PREVDOCHASH>${prevDocHash}</PREVDOCHASH>` : ''),
        );

        const docHash = sha256(xmlWithOfflineFields);

        const offlineDoc: OfflineDocument = {
            docType: isRefund ? OfflineDocumentType.RETURN_CHECK : OfflineDocumentType.CHECK,
            xml: xmlWithOfflineFields,
            uid: documentResult.uid,
            localNum: localNum || this.shift.orderNum,
            offlineLocalNum: this.offlineSession!.nextLocalNum!,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash,
            docHash,
            createdAt: new Date(),
            totalAmount,
        };

        this.offlineDocuments.push(offlineDoc);
        return { xml: xmlWithOfflineFields, uid: documentResult.uid };
    }

    buildOfflineReceipt(
        lines: ReceiptLine[],
        payment: PaymentData,
        localNum?: number,
        prevDocHash?: string,
    ): XMLDocumentResult {
        return this.buildOfflineReceiptDocument(lines, payment, {
            isRefund: false,
            localNum,
            prevDocHash,
        });
    }

    buildOfflineRefund(
        lines: ReceiptLine[],
        payment: PaymentData,
        originalFiscalNumber: string,
        localNum?: number,
        prevDocHash?: string,
    ): XMLDocumentResult {
        return this.buildOfflineReceiptDocument(lines, payment, {
            isRefund: true,
            originalFiscalNumber,
            localNum,
            prevDocHash,
        });
    }

    buildOfflineZReport(data: ZReportData, localNum?: number, prevDocHash?: string): XMLDocumentResult {
        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline Z-report', 'OfflineDocumentBuilder');
        }

        const meta = createMeta();

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: this.shift.orderNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            prevDocHash,
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession.offlineSessionId,
            this.offlineSession!.nextLocalNum!,
            controlNumber,
        );

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
            ORDERTAXNUM: fiscalNumber,
            OFFLINE: true,
            PREVDOCHASH: prevDocHash,
            ...(this.testing && { TESTING: true }),
        };

        const realizPayforms = data.paymentForms?.map((form, index) => ({
            ROWNUM: (index + 1).toString(),
            PAYFORMCD: form.payFormCode,
            PAYFORMNM: form.payFormName,
            SUM: form.sum.toFixed(2),
        }));

        const realizTaxes = data.taxes?.map((tax, index) => ({
            ROWNUM: (index + 1).toString(),
            TYPE: tax.type,
            NAME: tax.name,
            LETTER: tax.letter,
            PRC: tax.rate.toFixed(2),
            TURNOVER: tax.turnover.toFixed(2),
            SUM: tax.sum.toFixed(2),
        }));

        const realizSection = {
            SUM: data.totalSales.toFixed(2),
            ORDERSCNT: data.salesCount,
            ...(realizPayforms && realizPayforms.length > 0 && { PAYFORMS: realizPayforms }),
            ...(realizTaxes && realizTaxes.length > 0 && { TAXES: realizTaxes }),
        };

        const refundPayforms = data.refundPaymentForms?.map((form, index) => ({
            ROWNUM: (index + 1).toString(),
            PAYFORMCD: form.payFormCode,
            PAYFORMNM: form.payFormName,
            SUM: form.sum.toFixed(2),
        }));

        const refundTaxes = data.refundTaxes?.map((tax, index) => ({
            ROWNUM: (index + 1).toString(),
            TYPE: tax.type,
            NAME: tax.name,
            LETTER: tax.letter,
            PRC: tax.rate.toFixed(2),
            TURNOVER: tax.turnover.toFixed(2),
            SUM: tax.sum.toFixed(2),
        }));

        const returnSection =
            data.totalRefunds > 0
                ? {
                      SUM: data.totalRefunds.toFixed(2),
                      ORDERSCNT: data.refundsCount,
                      ...(refundPayforms && refundPayforms.length > 0 && { PAYFORMS: refundPayforms }),
                      ...(refundTaxes && refundTaxes.length > 0 && { TAXES: refundTaxes }),
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

        const xml = buildXml('ZREP', 'ZREPHEAD', head, bodySections);

        const docHash = sha256(xml);

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.Z_REPORT,
            xml,
            uid: meta.uid,
            localNum: localNum || this.shift.orderNum,
            offlineLocalNum: this.offlineSession!.nextLocalNum!,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash,
            docHash,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);
        return { xml, uid: meta.uid };
    }

    getOfflineDocuments(): OfflineDocument[] {
        return [...this.offlineDocuments];
    }

    clearOfflineDocuments(): void {
        this.offlineDocuments = [];
    }

    createOfflinePackages(maxPackageSize: number = 100): OfflinePackage[] {
        const packages: OfflinePackage[] = [];
        const documents = this.getOfflineDocuments();

        for (let i = 0; i < documents.length; i += maxPackageSize) {
            const packageDocs = documents.slice(i, i + maxPackageSize);
            const package_: OfflinePackage = {
                documents: packageDocs,
                sessionId: this.offlineSession?.offlineSessionId || '',
                createdAt: new Date(),
            };
            packages.push(package_);
        }

        return packages;
    }

    createBinaryPackage(docs?: OfflineDocument[]): Buffer {
        const documents = docs || this.getOfflineDocuments();
        const base64Docs = documents.map((doc) => Buffer.from(doc.xml).toString('base64'));
        return createOfflinePackage(base64Docs);
    }

    getSessionStats(monthlyDuration: number = 0) {
        if (!this.offlineSession) {
            throw new BuilderError('No offline session active', 'OfflineDocumentBuilder');
        }

        const stats = calculateOfflineSessionStats(
            this.offlineSession.startTime || new Date(),
            monthlyDuration,
            this.offlineDocuments.length,
        );

        stats.sessionId = this.offlineSession.offlineSessionId;
        return stats;
    }
}
