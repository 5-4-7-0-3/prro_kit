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
import { OnlineDocumentBuilder } from './online-builder';

/**
 * Білдер для створення офлайн PRRO документів
 * Розширює базовий білдер функціональністю для офлайн режиму
 */
export class OfflineDocumentBuilder extends PRROBuilder {
    private offlineSession?: OfflineSessionData;
    private offlineDocuments: OfflineDocument[] = [];
    private lastDocHash?: string;
    private isFirstFinancialDoc = true;

    constructor(shift: ShiftData, offlineSession?: OfflineSessionData) {
        super(shift);
        this.offlineSession = offlineSession;
    }

    setOfflineSession(session: OfflineSessionData): this {
        this.offlineSession = session;
        return this;
    }

    getOfflineSession(): OfflineSessionData | undefined {
        return this.offlineSession;
    }

    buildOfflineBegin(revokeLastOnlineDoc: boolean = false): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });
        // Перед початком нової офлайн сесії скидаємо лічильник
        if (this.offlineSession) {
            this.offlineSession.nextLocalNum = 1;
        }
        const offlineLocalNum = this.getNextOfflineLocalNum();
        // Використовуємо offlineLocalNum як локальний номер для контрольного числа
        const currentLocalNum = offlineLocalNum;

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession!.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: currentLocalNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            ...(this.lastDocHash && { prevDocHash: this.lastDocHash }),
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession!.offlineSessionId,
            offlineLocalNum,
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
            CASHIER: this.shift.cashier,
            VER: 1,
            ORDERTAXNUM: fiscalNumber,
            OFFLINE: true,
            ...(revokeLastOnlineDoc && { REVOKELASTONLINEDOC: 'true' }),
            ...(this.testing && { TESTING: 1 }),
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OFFLINE_BEGIN,
            xml,
            uid: meta.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum: offlineLocalNum,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);
        this.isFirstFinancialDoc = true;

        return { xml, uid: meta.uid };
    }

    buildOfflineEnd(): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });
        const offlineLocalNum = this.getNextOfflineLocalNum();
        const currentLocalNum = offlineLocalNum;

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession!.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: currentLocalNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            ...(this.lastDocHash && { prevDocHash: this.lastDocHash }),
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession!.offlineSessionId,
            offlineLocalNum,
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
            ...(this.testing && { TESTING: 1 }),
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OFFLINE_END,
            xml,
            uid: meta.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum: offlineLocalNum,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);
        return { xml, uid: meta.uid };
    }

    buildOfflineReceipt(lines: ReceiptLine[], payment: PaymentData, localNum?: number): XMLDocumentResult {
        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline receipt', 'OfflineDocumentBuilder');
        }

        const stats = calculateOfflineSessionStats(
            this.offlineSession.startTime || new Date(),
            0,
            this.offlineDocuments.length,
        );

        if (!canContinueOfflineSession(stats)) {
            throw new BuilderError('Offline session time limit exceeded', 'OfflineDocumentBuilder');
        }

        const meta = createMeta({ isTestMode: this.testing });
        const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);
        const offlineLocalNum = this.getNextOfflineLocalNum();
        const currentLocalNum = offlineLocalNum;

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: currentLocalNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            totalAmount,
            ...(this.lastDocHash && !this.isFirstFinancialDoc && { prevDocHash: this.lastDocHash }),
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession.offlineSessionId,
            offlineLocalNum,
            controlNumber,
        );

        const receipt = super.buildReceipt(lines, payment);

        const xmlWithOfflineFields = receipt.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (this.lastDocHash && !this.isFirstFinancialDoc
                    ? `<PREVDOCHASH>${this.lastDocHash}</PREVDOCHASH>`
                    : '') +
                '<CASHREGISTERNUM>',
        );

        const docHash = sha256(xmlWithOfflineFields);
        this.lastDocHash = docHash;
        this.isFirstFinancialDoc = false;

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.CHECK,
            xml: xmlWithOfflineFields,
            uid: receipt.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash: this.lastDocHash,
            docHash,
            createdAt: new Date(),
            totalAmount,
        };

        this.offlineDocuments.push(offlineDoc);

        return { xml: xmlWithOfflineFields, uid: receipt.uid };
    }

    buildOfflineRefund(
        lines: ReceiptLine[],
        payment: PaymentData,
        originalFiscalNumber: string,
        localNum?: number,
    ): XMLDocumentResult {
        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline refund', 'OfflineDocumentBuilder');
        }

        const meta = createMeta({ isTestMode: this.testing });
        const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);
        const offlineLocalNum = this.getNextOfflineLocalNum();
        const currentLocalNum = offlineLocalNum;

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: currentLocalNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            totalAmount,
            ...(this.lastDocHash && !this.isFirstFinancialDoc && { prevDocHash: this.lastDocHash }),
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession.offlineSessionId,
            offlineLocalNum,
            controlNumber,
        );

        const refund = super.buildRefund(lines, payment, originalFiscalNumber);

        const xmlWithOfflineFields = refund.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (this.lastDocHash && !this.isFirstFinancialDoc
                    ? `<PREVDOCHASH>${this.lastDocHash}</PREVDOCHASH>`
                    : '') +
                '<CASHREGISTERNUM>',
        );

        const docHash = sha256(xmlWithOfflineFields);
        this.lastDocHash = docHash;
        this.isFirstFinancialDoc = false;

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.RETURN_CHECK,
            xml: xmlWithOfflineFields,
            uid: refund.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash: this.lastDocHash,
            docHash,
            createdAt: new Date(),
            totalAmount,
        };

        this.offlineDocuments.push(offlineDoc);

        return { xml: xmlWithOfflineFields, uid: refund.uid };
    }

    buildOfflineZReport(data: ZReportData, localNum?: number): XMLDocumentResult {
        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline Z-report', 'OfflineDocumentBuilder');
        }

        const meta = createMeta({ isTestMode: this.testing });
        const offlineLocalNum = this.getNextOfflineLocalNum();
        const currentLocalNum = offlineLocalNum;

        const controlNumberData: ControlNumberData = {
            offlineSeed: this.offlineSession.offlineSeed,
            date: meta.date,
            time: meta.time,
            localNum: currentLocalNum,
            fiscalNum: this.shift.numFiscal,
            localRegNum: String(this.shift.numLocal),
            ...(this.lastDocHash && !this.isFirstFinancialDoc && { prevDocHash: this.lastDocHash }),
        };

        const controlNumber = calculateControlNumber(controlNumberData);
        const fiscalNumber = formatOfflineFiscalNumber(
            this.offlineSession.offlineSessionId,
            offlineLocalNum,
            controlNumber,
        );

        const onlineBuilder = new OnlineDocumentBuilder(this.shift);
        onlineBuilder.setTestMode(this.testing);
        const zReport = onlineBuilder.buildZReport(data);

        const xmlWithOfflineFields = zReport.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (this.lastDocHash && !this.isFirstFinancialDoc
                    ? `<PREVDOCHASH>${this.lastDocHash}</PREVDOCHASH>`
                    : '') +
                '<CASHREGISTERNUM>',
        );

        const docHash = sha256(xmlWithOfflineFields);
        this.lastDocHash = docHash;
        this.isFirstFinancialDoc = false;

        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.Z_REPORT,
            xml: xmlWithOfflineFields,
            uid: zReport.uid,
            localNum: this.shift.orderNum,
            offlineLocalNum,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash: this.lastDocHash,
            docHash,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);

        return { xml: xmlWithOfflineFields, uid: zReport.uid };
    }

    getOfflineDocuments(): OfflineDocument[] {
        return [...this.offlineDocuments];
    }

    clearOfflineDocuments(): void {
        this.offlineDocuments = [];
        this.lastDocHash = undefined;
        this.isFirstFinancialDoc = true;
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

    private getNextOfflineLocalNum(): number {
        if (!this.offlineSession) {
            throw new BuilderError('No offline session active', 'OfflineDocumentBuilder');
        }

        const nextNum = this.offlineSession.nextLocalNum || 1;
        this.offlineSession.nextLocalNum = nextNum + 1;
        return nextNum;
    }
}
