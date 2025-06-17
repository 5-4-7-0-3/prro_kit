/**
 * Константи для роботи з PRRO
 */
export const PRRO_CONSTANTS = {
    /** Типи документів */
    DOC_TYPES: {
        /** Чек реалізації товарів/послуг */
        RECEIPT: 0,
        /** Відкриття зміни */
        OPEN_SHIFT: 100,
        /** Закриття зміни */
        CLOSE_SHIFT: 101,
        /** Початок офлайн сесії */
        OFFLINE_BEGIN: 102,
        /** Завершення офлайн сесії */
        OFFLINE_END: 103,
    },

    /** Підтипи документів */
    DOC_SUBTYPES: {
        /** Касовий чек (реалізація) */
        SALE: 0,
        /** Видатковий чек (повернення) */
        RETURN: 1,
        /** Чек сторнування */
        CANCEL: 5,
    },

    /** Типи платежів */
    PAYMENT_TYPES: {
        /** Готівка */
        CASH: 0,
        /** Банківська картка */
        CARD: 1,
    },
} as const;

/** Експорт окремих констант для зручності */
export const DOC_TYPES = PRRO_CONSTANTS.DOC_TYPES;
export const DOC_SUBTYPES = PRRO_CONSTANTS.DOC_SUBTYPES;
export const PAYMENT_TYPES = PRRO_CONSTANTS.PAYMENT_TYPES;

/** Методи оплати */
export const PAYMENT_METHODS = {
    CASH: 'CASH',
    CARD: 'CARD',
} as const;

/** Типи операцій */
export const OPERATION_TYPES = {
    SALE: 'SALE',
    REFUND: 'REFUND',
} as const;
