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

    /**
     * Створює новий екземпляр офлайн білдера
     * @param shift - Дані зміни
     * @param offlineSession - Дані офлайн сесії (опціонально)
     */
    constructor(shift: ShiftData, offlineSession?: OfflineSessionData) {
        super(shift);
        this.offlineSession = offlineSession;
    }

    /**
     * Встановлює дані офлайн сесії
     * @param session - Дані офлайн сесії
     * @returns this для ланцюгових викликів
     */
    setOfflineSession(session: OfflineSessionData): this {
        this.offlineSession = session;
        return this;
    }

    /**
     * Отримує поточну офлайн сесію
     * @returns Дані офлайн сесії або undefined
     */
    getOfflineSession(): OfflineSessionData | undefined {
        return this.offlineSession;
    }

    /**
     * Створює документ початку офлайн сесії
     * @param revokeLastOnlineDoc - Чи відкликати останній онлайн документ
     * @returns Об'єкт з XML документом та UID
     * @example
     * ```typescript
     * // Звичайний початок офлайн сесії
     * const beginOffline = builder.buildOfflineBegin();
     *
     * // З відкликанням останнього онлайн документа
     * const beginWithRevoke = builder.buildOfflineBegin(true);
     * ```
     */
    buildOfflineBegin(revokeLastOnlineDoc: boolean = false): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });

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
            OFFLINE: true,
            ...(revokeLastOnlineDoc && { REVOKELASTONLINEDOC: 'true' }),
            ...(this.testing && { TESTING: 1 }),
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        // Створюємо офлайн документ
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OFFLINE_BEGIN,
            xml,
            uid: meta.uid,
            localNum: Number(this.shift.orderNum),
            offlineLocalNum: 1, // Перший документ в офлайн сесії
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);

        // Початок офлайн сесії не має гешу попереднього документа
        this.isFirstFinancialDoc = true;

        return { xml, uid: meta.uid };
    }

    /**
     * Створює документ завершення офлайн сесії
     * @returns Об'єкт з XML документом та UID
     * @example
     * ```typescript
     * const endOffline = builder.buildOfflineEnd();
     * ```
     */
    buildOfflineEnd(): XMLDocumentResult {
        const meta = createMeta({ isTestMode: this.testing });

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
            OFFLINE: true,
            ...(this.testing && { TESTING: 1 }),
        };

        const xml = buildXml('CHECK', 'CHECKHEAD', head);

        // Створюємо офлайн документ
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.OFFLINE_END,
            xml,
            uid: meta.uid,
            localNum: Number(this.shift.orderNum),
            offlineLocalNum: this.getNextOfflineLocalNum(),
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);

        return { xml, uid: meta.uid };
    }

    /**
     * Створює офлайн чек продажу
     * @param lines - Масив товарних позицій
     * @param payment - Дані оплати
     * @param localNum - Локальний номер документа
     * @returns Об'єкт з XML документом та UID
     * @throws {BuilderError} Якщо не встановлена офлайн сесія
     */
    buildOfflineReceipt(lines: ReceiptLine[], payment: PaymentData, localNum?: number): XMLDocumentResult {
        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline receipt', 'OfflineDocumentBuilder');
        }

        // Перевіряємо чи можна продовжувати офлайн сесію
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
        const currentLocalNum = localNum || Number(this.shift.orderNum);

        // Розраховуємо контрольне число
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

        // Створюємо чек з офлайн полями
        const receipt = super.buildReceipt(lines, payment);

        // Додаємо офлайн специфічні поля
        const xmlWithOfflineFields = receipt.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (this.lastDocHash && !this.isFirstFinancialDoc
                    ? `<PREVDOCHASH>${this.lastDocHash}</PREVDOCHASH>`
                    : '') +
                '<CASHREGISTERNUM>',
        );

        // Розраховуємо геш документа для наступного документа
        const docHash = sha256(xmlWithOfflineFields);
        this.lastDocHash = docHash;
        this.isFirstFinancialDoc = false;

        // Створюємо офлайн документ
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.CHECK,
            xml: xmlWithOfflineFields,
            uid: receipt.uid,
            localNum: currentLocalNum,
            offlineLocalNum,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash: this.lastDocHash,
            docHash,
            createdAt: new Date(),
            totalAmount,
        };

        this.offlineDocuments.push(offlineDoc);

        return {
            xml: xmlWithOfflineFields,
            uid: receipt.uid,
        };
    }

    /**
     * Створює офлайн чек повернення
     * @param lines - Масив товарних позицій для повернення
     * @param payment - Дані повернення коштів
     * @param originalFiscalNumber - Фіскальний номер оригінального чека
     * @param localNum - Локальний номер документа
     * @returns Об'єкт з XML документом та UID
     */
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
        const currentLocalNum = localNum || Number(this.shift.orderNum);

        // Розраховуємо контрольне число
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

        // Створюємо чек повернення з офлайн полями
        const refund = super.buildRefund(lines, payment, originalFiscalNumber);

        // Додаємо офлайн специфічні поля
        const xmlWithOfflineFields = refund.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (this.lastDocHash && !this.isFirstFinancialDoc
                    ? `<PREVDOCHASH>${this.lastDocHash}</PREVDOCHASH>`
                    : '') +
                '<CASHREGISTERNUM>',
        );

        // Розраховуємо геш документа
        const docHash = sha256(xmlWithOfflineFields);
        this.lastDocHash = docHash;
        this.isFirstFinancialDoc = false;

        // Створюємо офлайн документ
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.RETURN_CHECK,
            xml: xmlWithOfflineFields,
            uid: refund.uid,
            localNum: currentLocalNum,
            offlineLocalNum,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash: this.lastDocHash,
            docHash,
            createdAt: new Date(),
            totalAmount,
        };

        this.offlineDocuments.push(offlineDoc);

        return {
            xml: xmlWithOfflineFields,
            uid: refund.uid,
        };
    }

    /**
     * Створює офлайн Z-звіт
     * @param data - Дані для Z-звіту
     * @param localNum - Локальний номер документа
     * @returns Об'єкт з XML документом та UID
     */
    buildOfflineZReport(data: ZReportData, localNum?: number): XMLDocumentResult {
        if (!this.offlineSession) {
            throw new BuilderError('Offline session data is required for offline Z-report', 'OfflineDocumentBuilder');
        }

        const meta = createMeta({ isTestMode: this.testing });
        const offlineLocalNum = this.getNextOfflineLocalNum();
        const currentLocalNum = localNum || Number(this.shift.orderNum);

        // Розраховуємо контрольне число (для Z-звіту без суми)
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

        // Створюємо Z-звіт (використовуємо OnlineDocumentBuilder функціональність)
        const onlineBuilder = new OnlineDocumentBuilder(this.shift);
        onlineBuilder.setTestMode(this.testing);
        const zReport = onlineBuilder.buildZReport(data);

        // Додаємо офлайн специфічні поля
        const xmlWithOfflineFields = zReport.xml.replace(
            '<CASHREGISTERNUM>',
            `<ORDERTAXNUM>${fiscalNumber}</ORDERTAXNUM><OFFLINE>true</OFFLINE>` +
                (this.lastDocHash && !this.isFirstFinancialDoc
                    ? `<PREVDOCHASH>${this.lastDocHash}</PREVDOCHASH>`
                    : '') +
                '<CASHREGISTERNUM>',
        );

        // Розраховуємо геш документа
        const docHash = sha256(xmlWithOfflineFields);
        this.lastDocHash = docHash;
        this.isFirstFinancialDoc = false;

        // Створюємо офлайн документ
        const offlineDoc: OfflineDocument = {
            docType: OfflineDocumentType.Z_REPORT,
            xml: xmlWithOfflineFields,
            uid: zReport.uid,
            localNum: currentLocalNum,
            offlineLocalNum,
            fiscalNum: fiscalNumber,
            controlNumber,
            prevDocHash: this.lastDocHash,
            docHash,
            createdAt: new Date(),
        };

        this.offlineDocuments.push(offlineDoc);

        return {
            xml: xmlWithOfflineFields,
            uid: zReport.uid,
        };
    }

    /**
     * Отримує всі офлайн документи
     * @returns Масив офлайн документів
     */
    getOfflineDocuments(): OfflineDocument[] {
        return [...this.offlineDocuments];
    }

    /**
     * Очищує список офлайн документів
     */
    clearOfflineDocuments(): void {
        this.offlineDocuments = [];
        this.lastDocHash = undefined;
        this.isFirstFinancialDoc = true;
    }

    /**
     * Створює пакет офлайн документів для відправки
     * @param maxPackageSize - Максимальна кількість документів в пакеті (за замовчуванням 100)
     * @returns Масив пакетів офлайн документів
     */
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

    /**
     * Створює бінарний пакет офлайн документів для відправки
     * @param docs - Масив документів для пакування (опціонально, за замовчуванням всі документи)
     * @returns Buffer з пакетом документів
     */
    createBinaryPackage(docs?: OfflineDocument[]): Buffer {
        const documents = docs || this.getOfflineDocuments();
        const base64Docs = documents.map((doc) => Buffer.from(doc.xml).toString('base64'));
        return createOfflinePackage(base64Docs);
    }

    /**
     * Отримує статистику офлайн сесії
     * @param monthlyDuration - Загальна тривалість за місяць (хвилини)
     * @returns Статистика сесії
     */
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

    /**
     * Отримує наступний локальний номер в офлайн сесії
     * @returns Наступний локальний номер
     */
    private getNextOfflineLocalNum(): number {
        if (!this.offlineSession) {
            throw new BuilderError('No offline session active', 'OfflineDocumentBuilder');
        }

        const nextNum = this.offlineSession.nextLocalNum || 1;
        this.offlineSession.nextLocalNum = nextNum + 1;
        return nextNum;
    }
}
