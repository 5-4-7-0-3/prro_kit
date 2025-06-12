import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { MetaData, DocType, OpenShiftParams } from '../types';

/**
 * Параметри для відкриття зміни
 * @property {ShiftData} shift - Дані каси та організації
 */

/**
 * Генерує XML для відкриття зміни
 * @param {OpenShiftParams} opts - Параметри генерації
 * @returns {Object} Об'єкт з XML та UUID документа
 */
export function buildOpenShiftXml(opts: OpenShiftParams): { xml: string; uid: string } {
    const { shift, ...metaOpts } = opts;
    const meta: MetaData = createMeta(metaOpts);

    const head = {
        DOCTYPE: DocType.OpenShift,
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

    return {
        xml: buildXml('CHECK', 'CHECKHEAD', head),
        uid: meta.uid,
    };
}
