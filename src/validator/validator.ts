import { ShiftData, ReceiptLine, PaymentData, ValidationResult } from '../core/types';
import {
    isValidTIN,
    isValidOrderNumber,
    isValidFiscalNumber,
    isValidItemName,
    isValidAmount,
    isValidQuantity,
} from './validation';

/**
 * Валідатор для PRRO документів
 * Перевіряє коректність даних перед генерацією XML
 */
export class PRROValidator {
    /**
     * Валідує дані зміни
     * @param shift - Дані зміни для валідації
     * @returns Результат валідації з масивом помилок
     * @example
     * ```typescript
     * const validator = new PRROValidator();
     * const result = validator.validateShift(shiftData);
     *
     * if (!result.isValid) {
     *   console.error('Помилки:', result.errors);
     * }
     * ```
     */
    validateShift(shift: ShiftData): ValidationResult {
        const errors: string[] = [];

        // Валідація ІПН
        if (!isValidTIN(shift.tin)) {
            errors.push('ІПН повинен містити 10 або 12 цифр');
        }

        // Валідація ІПН платника ПДВ (якщо вказано)
        if (shift.ipn && shift.ipn.length !== 12) {
            errors.push('ІПН платника ПДВ повинен містити 12 цифр');
        }

        // Валідація назви організації
        if (!shift.orgName || shift.orgName.trim().length === 0) {
            errors.push("Назва організації обов'язкова");
        }

        if (shift.orgName && shift.orgName.length > 256) {
            errors.push('Назва організації не може перевищувати 256 символів');
        }

        // Валідація назви точки продажу
        if (!shift.taxObjectsName || shift.taxObjectsName.trim().length === 0) {
            errors.push("Назва точки продажу обов'язкова");
        }

        if (shift.taxObjectsName && shift.taxObjectsName.length > 256) {
            errors.push('Назва точки продажу не може перевищувати 256 символів');
        }

        // Валідація адреси
        if (!shift.address || shift.address.trim().length === 0) {
            errors.push("Адреса точки продажу обов'язкова");
        }

        if (shift.address && shift.address.length > 256) {
            errors.push('Адреса не може перевищувати 256 символів');
        }

        // Валідація номера документа
        if (!isValidOrderNumber(shift.orderNum)) {
            errors.push("Номер документа обов'язковий (до 50 символів)");
        }

        // Валідація фіскального номера
        if (!isValidFiscalNumber(shift.numFiscal)) {
            errors.push('Фіскальний номер РРО повинен містити 10 цифр');
        }

        // Валідація касира
        if (!shift.cashier || shift.cashier.trim().length === 0) {
            errors.push("ПІБ касира обов'язкове");
        }

        if (shift.cashier && shift.cashier.length > 128) {
            errors.push('ПІБ касира не може перевищувати 128 символів');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Валідує дані чека
     * @param lines - Товарні позиції чека
     * @param payment - Дані оплати
     * @returns Результат валідації з масивом помилок
     * @example
     * ```typescript
     * const result = validator.validateReceipt(lines, payment);
     *
     * if (!result.isValid) {
     *   result.errors.forEach(error => console.error(error));
     * }
     * ```
     */
    validateReceipt(lines: ReceiptLine[], payment: PaymentData): ValidationResult {
        const errors: string[] = [];

        // Перевірка наявності позицій
        if (!lines || lines.length === 0) {
            errors.push('Чек повинен містити хоча б одну позицію');
        }

        // Валідація кожної позиції
        lines.forEach((line, index) => {
            const position = index + 1;

            // Валідація номера рядка
            if (!line.ROWNUM) {
                errors.push(`Позиція ${position}: номер рядка обов'язковий`);
            }

            // Валідація коду товару
            if (!line.CODE || line.CODE.trim().length === 0) {
                errors.push(`Позиція ${position}: код товару обов'язковий`);
            }

            if (line.CODE && line.CODE.length > 64) {
                errors.push(`Позиція ${position}: код товару не може перевищувати 64 символи`);
            }

            // Валідація назви товару
            if (!isValidItemName(line.NAME)) {
                errors.push(`Позиція ${position}: назва товару обов'язкова (до 128 символів)`);
            }

            // Валідація одиниці виміру
            if (!line.UNITNM || line.UNITNM.trim().length === 0) {
                errors.push(`Позиція ${position}: одиниця виміру обов'язкова`);
            }

            if (line.UNITNM && line.UNITNM.length > 64) {
                errors.push(`Позиція ${position}: одиниця виміру не може перевищувати 64 символи`);
            }

            // Валідація кількості
            if (!isValidQuantity(line.AMOUNT)) {
                errors.push(`Позиція ${position}: кількість повинна бути більше 0 (до 999999.999)`);
            }

            // Валідація ціни
            if (!isValidAmount(line.PRICE)) {
                errors.push(`Позиція ${position}: ціна повинна бути від 0 до 99999999.99`);
            }

            // Валідація суми
            if (!isValidAmount(line.COST)) {
                errors.push(`Позиція ${position}: сума повинна бути від 0 до 99999999.99`);
            }

            // Перевірка правильності розрахунку суми
            const calculatedCost = Math.round(line.AMOUNT * line.PRICE * 100) / 100;
            if (Math.abs(calculatedCost - line.COST) > 0.01) {
                errors.push(`Позиція ${position}: сума (${line.COST}) не відповідає розрахунку (${calculatedCost})`);
            }

            // Валідація УКТЗЕД (якщо вказано)
            if (line.UKTZED && line.UKTZED.length > 15) {
                errors.push(`Позиція ${position}: код УКТЗЕД не може перевищувати 15 цифр`);
            }
        });

        // Валідація оплати
        if (!payment) {
            errors.push("Дані оплати обов'язкові");
        } else {
            // Валідація методу оплати
            if (payment.method !== 'CASH' && payment.method !== 'CARD') {
                errors.push('Метод оплати повинен бути CASH або CARD');
            }

            // Валідація суми оплати
            if (!isValidAmount(payment.amount)) {
                errors.push('Сума оплати повинна бути від 0 до 99999999.99');
            }

            // Перевірка відповідності суми чека сумі оплати
            const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);
            if (Math.abs(totalAmount - payment.amount) > 0.01) {
                errors.push(`Сума оплати (${payment.amount}) не співпадає з сумою чека (${totalAmount.toFixed(2)})`);
            }

            // Валідація готівкової оплати
            if (payment.method === 'CASH') {
                if (payment.provided !== undefined) {
                    if (!isValidAmount(payment.provided)) {
                        errors.push('Внесена сума повинна бути від 0 до 99999999.99');
                    }

                    if (payment.provided < payment.amount) {
                        errors.push('Внесена сума менша за суму чека');
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Валідує фіскальний номер
     * @param fiscalNumber - Номер для валідації
     * @returns true якщо номер валідний
     */
    validateFiscalNumber(fiscalNumber: string): boolean {
        return isValidFiscalNumber(fiscalNumber);
    }

    /**
     * Валідує суму
     * @param amount - Сума для валідації
     * @returns true якщо сума валідна
     */
    validateAmount(amount: number): boolean {
        return isValidAmount(amount);
    }
}
