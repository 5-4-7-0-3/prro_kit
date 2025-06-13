export class PRROError extends Error {
    constructor(
        message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'PRROError';
    }
}

export class ValidationError extends PRROError {
    constructor(message: string, public validationErrors: string[]) {
        super(message, 'VALIDATION_ERROR', { validationErrors });
        this.name = 'ValidationError';
    }
}

export class XMLError extends PRROError {
    constructor(message: string, xmlError?: string) {
        super(message, 'XML_ERROR', { xmlError });
        this.name = 'XMLError';
    }
}