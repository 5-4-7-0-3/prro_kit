import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { DocType, CloseShiftParams } from '../types';

/**
 * Параметри для закриття зміни
 * @property {ShiftData} shift - Дані каси та організації
 */

/**
 * Генерує XML для закриття зміни
 * @param {CloseShiftParams} opts - Параметри генерації
 * @returns {Object} Об'єкт з XML та UUID документа
 */
export function buildCloseShiftXml(opts: CloseShiftParams): { xml: string; uid: string } {
    const { shift, ...metaOpts } = opts;
    if (!shift.orderNum) throw new Error("Параметр orderNum обов'язковий");

    const meta = createMeta(metaOpts);
    const head = {
        DOCTYPE: DocType.CloseShift,
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
