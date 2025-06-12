import { createMeta } from '../utils/meta';
import { buildXml } from '../utils/xmlBuilder';
import { MetaData, DocType, OfflineEndParams } from '../types';

export function buildOfflineEndXml(opts: OfflineEndParams): { xml: string; uid: string } {
    const { shift, ...metaOpts } = opts;
    if (!shift.orderNum) throw new Error('orderNum is required');

    const meta: MetaData = createMeta(metaOpts);

    const head = {
        DOCTYPE: DocType.OfflineEnd,
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
        OFFLINE: true,
        ...(meta.testing && { TESTING: 1 }),
    };

    return {
        xml: buildXml('CHECK', 'CHECKHEAD', head),
        uid: meta.uid,
    };
}
