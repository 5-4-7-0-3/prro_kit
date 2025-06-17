/**
 * Базова помилка PRRO
 */
export class PRROError extends Error {
    /**
     * @param message - Повідомлення про помилку
     * @param code - Код помилки
     * @param details - Додаткові деталі
     */
    constructor(
        message: string,
        public code?: string,
        public details?: any,
    ) {
        super(message);
        this.name = 'PRROError';
    }
}

/**
 * Помилка валідації даних
 */
export class ValidationError extends PRROError {
    /**
     * @param message - Повідомлення про помилку
     * @param validationErrors - Масив помилок валідації
     */
    constructor(
        message: string,
        public validationErrors: string[],
    ) {
        super(message, 'VALIDATION_ERROR', { validationErrors });
        this.name = 'ValidationError';
    }
}

/**
 * Помилка генерації XML
 */
export class XMLError extends PRROError {
    /**
     * @param message - Повідомлення про помилку
     * @param xmlError - Деталі XML помилки
     */
    constructor(message: string, xmlError?: string) {
        super(message, 'XML_ERROR', { xmlError });
        this.name = 'XMLError';
    }
}

/**
 * Помилка білдера документів
 */
export class BuilderError extends PRROError {
    /**
     * @param message - Повідомлення про помилку
     * @param builderType - Тип білдера де сталася помилка
     */
    constructor(message: string, builderType?: string) {
        super(message, 'BUILDER_ERROR', { builderType });
        this.name = 'BuilderError';
    }
}
