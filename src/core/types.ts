export interface ShiftData {
    tin: string;
    orgName: string;
    taxObjectsName: string;
    address: string;
    orderNum: string;
    numLocal: string;
    numFiscal: string;
    cashier: string;
    ipn?: string;
}

export interface ReceiptLine {
    ROWNUM: string;
    CODE: string;
    NAME: string;
    UNITNM: string;
    AMOUNT: number;
    PRICE: number;
    COST: number;
}

export interface PaymentData {
    method: 'CASH' | 'CARD';
    amount: number;
    provided?: number;
}
