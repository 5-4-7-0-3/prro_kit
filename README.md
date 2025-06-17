# Robol PRRO Kit

**Robol PRRO Kit** — це TypeScript бібліотека для генерування XML-документів PRRO (Програмно-реєстраційні розрахункові операції) згідно з українським законодавством. Бібліотека дозволяє легко створювати фіскальні документи та взаємодіяти з фіскальним сервером.

## Особливості

- **Генерація XML документів** для всіх типів PRRO операцій
- **Онлайн та офлайн режими** роботи
- **Комплексна валідація** даних згідно з вимогами PRRO
- **API клієнт** для взаємодії з фіскальним сервером
- **TypeScript підтримка** з повною типізацією
- **Тестовий режим** для розробки
- **Утиліти** для роботи з датами та форматування

## Встановлення

```bash
npm install robol_prro_kit
```

```bash
yarn add robol_prro_kit
```

## Швидкий старт

### Базове використання

```typescript
import { createPRROBuilder, ShiftData, ReceiptLine, PaymentData } from 'robol_prro_kit';

// Дані зміни
const shiftData: ShiftData = {
    tin: '1234567890',
    orgName: 'ТОВ "Моя компанія"',
    taxObjectsName: 'Магазин №1',
    address: 'м. Київ, вул. Хрещатик, 1',
    orderNum: '1',
    numLocal: 'RRO001',
    numFiscal: '1234567890',
    cashier: 'Іванов Іван Іванович',
};

// Створення білдера
const builder = createPRROBuilder(shiftData, true); // true = тестовий режим

// Відкриття зміни
const openShift = builder.buildOpenShift();
console.log('XML відкриття зміни:', openShift.xml);

// Створення чека
const lines: ReceiptLine[] = [
    {
        ROWNUM: '1',
        CODE: '12345',
        NAME: 'Хліб білий',
        UNITNM: 'шт',
        AMOUNT: 2,
        PRICE: 25.5,
        COST: 51.0,
    },
];

const payment: PaymentData = {
    method: 'CASH',
    amount: 51.0,
    provided: 100.0,
};

const receipt = builder.buildReceipt(lines, payment);
console.log('XML чека:', receipt.xml);

// Закриття зміни
const closeShift = builder.buildCloseShift();
console.log('XML закриття зміни:', closeShift.xml);
```

## Типи документів

### Основні операції

#### Відкриття та закриття зміни

```typescript
// Відкриття зміни
const openShift = builder.buildOpenShift();

// Закриття зміни
const closeShift = builder.buildCloseShift();
```

#### Чек продажу

```typescript
const lines: ReceiptLine[] = [
    {
        ROWNUM: '1',
        CODE: 'PROD001',
        NAME: 'Товар 1',
        UNITNM: 'шт',
        AMOUNT: 1,
        PRICE: 100.0,
        COST: 100.0,
    },
];

const payment: PaymentData = {
    method: 'CARD', // або 'CASH'
    amount: 100.0,
};

const receipt = builder.buildReceipt(lines, payment);
```

#### Чек повернення

```typescript
const refund = builder.buildRefund(
    lines,
    payment,
    '1234567890', // фіскальний номер оригінального чека
);
```

### Онлайн режим

```typescript
import { createOnlineBuilder, ZReportData } from 'robol_prro_kit';

const onlineBuilder = createOnlineBuilder(shiftData);

// Z-звіт
const zReportData: ZReportData = {
    totalSales: 5000.0,
    totalRefunds: 250.0,
    salesCount: 25,
    refundsCount: 2,
    serviceInput: 1000.0,
    serviceOutput: 500.0,
};

const zReport = onlineBuilder.buildZReport(zReportData);
```

### Офлайн режим

```typescript
import { createOfflineBuilder } from 'robol_prro_kit';

const offlineBuilder = createOfflineBuilder(shiftData);

// Початок офлайн сесії
const beginOffline = offlineBuilder.buildOfflineBegin();

// Офлайн чек
const offlineReceipt = offlineBuilder.buildOfflineReceipt(
    lines,
    payment,
    '82563.25.6127', // фіскальний номер офлайн документа
);

// Завершення офлайн сесії
const endOffline = offlineBuilder.buildOfflineEnd();
```

## 🌐 API Клієнт

### Відправка документів на фіскальний сервер

```typescript
import { createPRROApiClient } from 'robol_prro_kit';

const client = createPRROApiClient();
// або з кастомним URL: createPRROApiClient('https://custom-server.com/fs');

// Відправка документа
const base64Document = Buffer.from(receipt.xml).toString('base64');

try {
    const response = await client.doc(base64Document);
    console.log('Документ відправлено:', response);
} catch (error) {
    console.error('Помилка відправки:', error.message);
}
```

### Відправка команд

```typescript
interface ServerStateResponse {
    Timestamp: string;
    UID: string;
}

const command = { Command: 'ServerState', UID: receipt.uid };
const base64Command = Buffer.from(JSON.stringify(command)).toString('base64');

const response = await client.cmd<ServerStateResponse>(base64Command);
console.log('Час сервера:', response.Timestamp);
```

### Відправка офлайн пакетів

```typescript
interface PackageResponse {
    OfflineSessionId: number;
    OfflineSeed: number;
}

const response = await client.pck<PackageResponse>(base64Package);
console.log('ID офлайн сесії:', response.OfflineSessionId);
```

## Валідація

### Автоматична валідація

Всі білдери автоматично валідують дані при створенні документів:

```typescript
import { BuilderError } from 'robol_prro_kit';

try {
    const receipt = builder.buildReceipt(invalidLines, invalidPayment);
} catch (error) {
    if (error instanceof BuilderError) {
        console.error('Помилка валідації:', error.message);
    }
}
```

### Ручна валідація

```typescript
import { quickValidateShift, quickValidateReceipt, PRROValidator } from 'robol_prro_kit';

// Швидка валідація
const shiftValidation = quickValidateShift(shiftData);
if (!shiftValidation.isValid) {
    console.error('Помилки зміни:', shiftValidation.errors);
}

const receiptValidation = quickValidateReceipt(lines, payment);
if (!receiptValidation.isValid) {
    console.error('Помилки чека:', receiptValidation.errors);
}

// Детальна валідація
const validator = new PRROValidator();
const result = validator.validateShift(shiftData);
```

## 🛠️ Утиліти

### Робота з датами

```typescript
import { getCurrentPRRODate, getCurrentPRROTime, getDateTime, PRRO_DATE_FORMATS } from 'robol_prro_kit';

// Поточна дата в форматі PRRO
const date = getCurrentPRRODate(); // "17062025"
const time = getCurrentPRROTime(); // "143022"

// Кастомне форматування
const formatted = getDateTime({
    format: 'default', // або 'date', 'time', тощо
    timeZone: 'Europe/Kyiv',
}); // "17.06.2025 14:30:22"
```

### Валідація даних

```typescript
import { isValidTIN, isValidAmount, isValidQuantity, formatAmount, formatQuantity } from 'robol_prro_kit';

// Валідація
const isValidTax = isValidTIN('1234567890'); // true
const isValidSum = isValidAmount(123.45); // true
const isValidQty = isValidQuantity(2.5); // true

// Форматування
const formattedAmount = formatAmount(123.456); // "123.46"
const formattedQty = formatQuantity(2.5); // "2.500"
```

## Приклади використання

### Повний цикл роботи

```typescript
import { createPRROBuilder, createPRROApiClient, ShiftData, ReceiptLine, PaymentData } from 'robol_prro_kit';

async function fullWorkflow() {
    // Налаштування
    const shiftData: ShiftData = {
        /* ваші дані */
    };
    const builder = createPRROBuilder(shiftData, false); // продакшн режим
    const client = createPRROApiClient();

    try {
        // 1. Відкриття зміни
        const openShift = builder.buildOpenShift();
        const openResponse = await client.doc(Buffer.from(openShift.xml).toString('base64'));
        console.log('Зміна відкрита:', openResponse);

        // 2. Продаж товарів
        const lines: ReceiptLine[] = [
            /* ваші товари */
        ];
        const payment: PaymentData = {
            /* оплата */
        };

        const receipt = builder.buildReceipt(lines, payment);
        const receiptResponse = await client.doc(Buffer.from(receipt.xml).toString('base64'));
        console.log('Чек створено:', receiptResponse);

        // 3. Закриття зміни
        const closeShift = builder.buildCloseShift();
        const closeResponse = await client.doc(Buffer.from(closeShift.xml).toString('base64'));
        console.log('Зміна закрита:', closeResponse);
    } catch (error) {
        console.error('Помилка:', error.message);
    }
}
```

### Обробка помилок

```typescript
import { PRROError, ValidationError, XMLError, BuilderError } from 'robol_prro_kit';

try {
    const receipt = builder.buildReceipt(lines, payment);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error('Помилки валідації:', error.validationErrors);
    } else if (error instanceof BuilderError) {
        console.error('Помилка білдера:', error.message);
    } else if (error instanceof XMLError) {
        console.error('Помилка XML:', error.details);
    } else if (error instanceof PRROError) {
        console.error('Загальна помилка PRRO:', error.message);
    }
}
```

## Конфігурація

### Тестовий режим

```typescript
// Увімкнення тестового режиму (додає поле TESTING: 1)
const testBuilder = createPRROBuilder(shiftData, true);

// Або через метод
const builder = createPRROBuilder(shiftData).setTestMode(true);
```

### Кастомний сервер

```typescript
// Для тестування або локальної розробки
const testClient = createPRROApiClient('http://localhost:8609/fs');
```

## 📚 API Документація

### Типи даних

#### `ShiftData`

```typescript
interface ShiftData {
    tin: string; // ЄДРПОУ/ДРФО (10 символів)
    orgName: string; // Назва організації (до 256 символів)
    taxObjectsName: string; // Назва точки продажу (до 256 символів)
    address: string; // Адреса (до 256 символів)
    orderNum: string; // Номер документа (до 128 символів)
    numLocal: string; // Локальний номер РРО (до 64 символів)
    numFiscal: string; // Фіскальний номер РРО (до 128 символів)
    cashier: string; // ПІБ касира (до 128 символів)
    ipn?: string; // ІПН (12 символів, опціонально)
}
```

#### `ReceiptLine`

```typescript
interface ReceiptLine {
    ROWNUM: string; // Номер рядка
    CODE: string; // Код товару (до 64 символів)
    NAME: string; // Назва товару
    UNITNM: string; // Одиниця виміру
    AMOUNT: number; // Кількість (до 15.3)
    PRICE: number; // Ціна (до 15.2)
    COST: number; // Сума (до 15.2)
    UKTZED?: string; // Код УКТЗЕД (15 цифр)
    LETTERS?: string; // Літерні позначення
}
```

#### `PaymentData`

```typescript
interface PaymentData {
    method: 'CASH' | 'CARD'; // Метод оплати
    amount: number; // Сума оплати
    provided?: number; // Внесено (для готівки)
}
```

### Константи

```typescript
import { DOC_TYPES, PAYMENT_TYPES, PRRO_CONSTANTS } from 'robol_prro_kit';

// Типи документів
DOC_TYPES.RECEIPT; // 0 - Чек
DOC_TYPES.OPEN_SHIFT; // 100 - Відкриття зміни
DOC_TYPES.CLOSE_SHIFT; // 101 - Закриття зміни
DOC_TYPES.OFFLINE_BEGIN; // 102 - Закриття зміни
DOC_TYPES.OFFLINE_END; // 103 - Закриття зміни

// Типи оплати
PAYMENT_TYPES.CASH; // 0 - Готівка
PAYMENT_TYPES.CARD; // 1 - Картка
```

## Тестування

```bash
# Запуск тестів
npm test

# Тести з відстеженням змін
npm run test:watch

# Покриття коду
npm run test:coverage
```
