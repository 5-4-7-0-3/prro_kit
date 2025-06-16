/**
 * Валідація даних для PRRO документів
 */

/**
 * Валідує ІПН (Індивідуальний податковий номер)
 * @param tin - ІПН для валідації
 * @returns true якщо ІПН валідний
 */
export function isValidTIN(tin: string): boolean {
    if (!tin || typeof tin !== 'string') return false;

    // ІПН може бути 10 або 12 цифр
    const cleanTin = tin.replace(/\D/g, '');
    return cleanTin.length === 10 || cleanTin.length === 12;
}

/**
 * Валідує фіскальний номер PRRO
 * @param fiscalNumber - Фіскальний номер для валідації
 * @returns true якщо номер валідний
 */
export function isValidFiscalNumber(fiscalNumber: string): boolean {
    if (!fiscalNumber || typeof fiscalNumber !== 'string') return false;

    // Фіскальний номер має бути 10 цифр
    const cleanNumber = fiscalNumber.replace(/\D/g, '');
    return cleanNumber.length === 10;
}

/**
 * Валідує номер документа
 * @param orderNum - Номер документа для валідації
 * @returns true якщо номер валідний
 */
export function isValidOrderNumber(orderNum: string): boolean {
    if (!orderNum || typeof orderNum !== 'string') return false;

    // Номер документа має бути непустим
    const trimmed = orderNum.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * Валідує суму грошей
 * @param amount - Сума для валідації
 * @returns true якщо сума валідна
 */
export function isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount >= 0 && amount <= 99999999.99; // Максимальна сума для PRRO
}

/**
 * Валідує кількість товару
 * @param quantity - Кількість для валідації
 * @returns true якщо кількість валідна
 */
export function isValidQuantity(quantity: number): boolean {
    return (
        typeof quantity === 'number' && !isNaN(quantity) && isFinite(quantity) && quantity > 0 && quantity <= 999999.999
    ); // Максимальна кількість для PRRO
}

/**
 * Форматує суму для PRRO (2 знаки після коми)
 * @param amount - Сума для форматування
 * @returns Відформатована сума
 */
export function formatAmount(amount: number): string {
    if (!isValidAmount(amount)) {
        throw new Error(`Invalid amount: ${amount}`);
    }
    return amount.toFixed(2);
}

/**
 * Форматує кількість для PRRO (3 знаки після коми)
 * @param quantity - Кількість для форматування
 * @returns Відформатована кількість
 */
export function formatQuantity(quantity: number): string {
    if (!isValidQuantity(quantity)) {
        throw new Error(`Invalid quantity: ${quantity}`);
    }
    return quantity.toFixed(3);
}

/**
 * Валідує назву товару/послуги
 * @param name - Назва для валідації
 * @returns true якщо назва валідна
 */
export function isValidItemName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;

    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 128;
}

/**
 * Очищає рядок для використання в XML
 * @param str - Рядок для очищення
 * @returns Очищений рядок
 */
export function sanitizeXMLString(str: string): string {
    if (!str || typeof str !== 'string') return '';

    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}
