import { ShiftData, ReceiptLine, PaymentData } from '../core/types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class PRROValidator {
    
    validateShift(shift: ShiftData): ValidationResult {
        const errors: string[] = [];

        if (!shift.tin || shift.tin.length !== 10) {
            errors.push('ІПН повинен містити 10 цифр');
        }

        if (!shift.orgName) {
            errors.push('Назва організації обов\'язкова');
        }

        if (!shift.orderNum) {
            errors.push('Номер документа обов\'язковий');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateReceipt(lines: ReceiptLine[], payment: PaymentData): ValidationResult {
        const errors: string[] = [];

        if (!lines || lines.length === 0) {
            errors.push('Чек повинен містити хоча б одну позицію');
        }

        lines.forEach((line, index) => {
            if (!line.NAME) {
                errors.push(`Позиція ${index + 1}: назва товару обов\'язкова`);
            }
            if (line.AMOUNT <= 0) {
                errors.push(`Позиція ${index + 1}: кількість повинна бути більше 0`);
            }
            if (line.PRICE <= 0) {
                errors.push(`Позиція ${index + 1}: ціна повинна бути більше 0`);
            }
        });

        const totalAmount = lines.reduce((sum, line) => sum + line.COST, 0);
        if (Math.abs(totalAmount - payment.amount) > 0.01) {
            errors.push('Сума оплати не співпадає з сумою чека');
        }

        if (payment.method === 'CASH' && payment.provided && payment.provided < payment.amount) {
            errors.push('Внесена сума менша за суму чека');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}