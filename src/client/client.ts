import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Клієнт для взаємодії з PRRO Фіскальним Сервером
 *
 * @example
 * ```typescript
 * import { PRROApiClient } from 'prro_kit';
 *
 * const client = new PRROApiClient();
 *
 * // Відправка документа
 * const docResponse = await client.doc(base64Document);
 *
 * // Відправка команди
 * const cmdResponse = await client.cmd<MyResponseType>(base64Command);
 *
 * // Відправка пакета офлайн документів
 * const pckResponse = await client.pck<PackageResponseType>(base64Package);
 * ```
 */
export class PRROApiClient {
    private readonly axiosInstance: AxiosInstance;
    private readonly baseUrl: string;

    /**
     * Створює новий екземпляр API клієнта
     * @param baseUrl - Базова адреса PRRO сервера (за замовчуванням: http://fs.tax.gov.ua:8609/fs)
     */
    constructor(baseUrl: string = 'http://fs.tax.gov.ua:8609/fs') {
        this.baseUrl = baseUrl;
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });
    }

    /**
     * Відправляє документ (чек, Z-звіт) на фіскальний сервер
     * @param base64Document - Документ в кодуванні Base64
     * @returns Відповідь сервера
     * @throws {Error} Якщо виникла помилка при відправці
     *
     * @example
     * ```typescript
     * const client = new PRROApiClient();
     * const base64Doc = Buffer.from(xmlDocument).toString('base64');
     *
     * try {
     *   const response = await client.doc(base64Doc);
     *   console.log('Документ відправлено:', response);
     * } catch (error) {
     *   console.error('Помилка:', error.message);
     * }
     * ```
     */
    async doc(base64Document: string): Promise<any> {
        if (!base64Document) {
            throw new Error('Base64 document is required');
        }

        try {
            const buffer = Buffer.from(base64Document, 'base64');

            const response = await this.axiosInstance.post('/doc', buffer, {
                headers: {
                    'Content-Length': buffer.length.toString(),
                },
            });

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Відправляє команду на фіскальний сервер
     * @param base64Command - Команда в кодуванні Base64
     * @returns Відповідь сервера з типізацією
     * @throws {Error} Якщо виникла помилка при відправці
     *
     * @example
     * ```typescript
     * interface ServerStateResponse {
     *   Timestamp: string;
     *   UID: string;
     * }
     *
     * const client = new PRROApiClient();
     * const command = { Command: "ServerState", UID: "some-uid" };
     * const base64Cmd = Buffer.from(JSON.stringify(command)).toString('base64');
     *
     * const response = await client.cmd<ServerStateResponse>(base64Cmd);
     * console.log('Час сервера:', response.Timestamp);
     * ```
     */
    async cmd<T = any>(base64Command: string): Promise<T> {
        if (!base64Command) {
            throw new Error('Base64 command is required');
        }

        try {
            const buffer = Buffer.from(base64Command, 'base64');

            const response = await this.axiosInstance.post<T>('/cmd', buffer, {
                headers: {
                    'Content-Length': buffer.length.toString(),
                },
            });

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Відправляє пакет офлайн документів на фіскальний сервер
     * @param base64Package - Пакет документів в кодуванні Base64
     * @returns Відповідь сервера з типізацією
     * @throws {Error} Якщо виникла помилка при відправці
     *
     * @example
     * ```typescript
     * interface PackageResponse {
     *   OfflineSessionId: number;
     *   OfflineSeed: number;
     * }
     *
     * const client = new PRROApiClient();
     * const base64Package = createOfflinePackage(); // ваша функція створення пакета
     *
     * const response = await client.pck<PackageResponse>(base64Package);
     * console.log('ID офлайн сесії:', response.OfflineSessionId);
     * ```
     */
    async pck<T = any>(base64Package: string): Promise<T> {
        if (!base64Package) {
            throw new Error('Base64 package is required');
        }

        try {
            const buffer = Buffer.from(base64Package, 'base64');

            const response = await this.axiosInstance.post<T>('/pck', buffer, {
                headers: {
                    'Content-Length': buffer.length.toString(),
                },
            });

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Обробляє помилки axios та повертає зрозумілі повідомлення
     * @param error - Помилка axios
     * @returns Error об'єкт з детальним описом
     */
    private handleError(error: unknown): Error {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            // Якщо є відповідь від сервера з помилкою
            if (axiosError.response) {
                const errorMessage = axiosError.response.data || axiosError.message;
                return new Error(`PRRO Server Error: ${errorMessage}`);
            }

            // Якщо запит не вдалося відправити
            if (axiosError.request) {
                return new Error('PRRO Server is not responding');
            }

            // Інші помилки axios
            return new Error(`Request Error: ${axiosError.message}`);
        }

        // Невідомі помилки
        return error instanceof Error ? error : new Error(String(error));
    }
}

/**
 * Створює новий екземпляр PRRO API клієнта
 * @param baseUrl - Базова адреса PRRO сервера
 * @returns Налаштований API клієнт
 *
 * @example
 * ```typescript
 * // Використання стандартного сервера
 * const client = createPRROApiClient();
 *
 * // Використання кастомного сервера (для тестування)
 * const testClient = createPRROApiClient('https://test.example.com/fs');
 * ```
 */
export function createPRROApiClient(baseUrl?: string): PRROApiClient {
    return new PRROApiClient(baseUrl);
}
