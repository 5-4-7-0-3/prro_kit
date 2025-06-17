import { create } from 'xmlbuilder2';

/**
 * Опції для створення XML документа
 */
const XML_OPTIONS = {
    version: '1.0',
    encoding: 'windows-1251',
} as const;

/**
 * Опції для серіалізації XML
 */
const SERIALIZATION_OPTIONS = {
    prettyPrint: false,
    wellFormed: true,
} as const;

/**
 * Створює XML-документ з вказаною структурою для PRRO
 * @param rootName - Назва кореневого елементу (CHECK, ZREP)
 * @param headTag - Назва тегу заголовка (CHECKHEAD, ZREPHEAD)
 * @param headData - Дані заголовка
 * @param bodySections - Секції тіла документа (опціонально)
 * @returns Згенерований XML рядок
 */
export function buildXml(
    rootName: string,
    headTag: string,
    headData: Record<string, any>,
    bodySections?: Record<string, any>,
): string {
    try {
        const doc = create(XML_OPTIONS).ele(rootName, {
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:noNamespaceSchemaLocation': `${rootName.toLowerCase()}01.xsd`,
        });

        // Додавання заголовка
        const head = doc.ele(headTag);
        Object.entries(headData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                head.ele(key).txt(String(value));
            }
        });
        head.up();

        // Додавання секцій тіла документа
        if (bodySections) {
            Object.entries(bodySections).forEach(([sectionName, content]) => {
                const section = doc.ele(sectionName);

                if (Array.isArray(content)) {
                    // Для масивів створюємо ROW елементи
                    content.forEach((item) => {
                        const row = section.ele('ROW');
                        Object.entries(item).forEach(([field, val]) => {
                            if (val !== undefined && val !== null) {
                                row.ele(field).txt(String(val));
                            }
                        });
                        row.up();
                    });
                } else if (typeof content === 'object' && content !== null) {
                    // Для об'єктів створюємо прямі елементи
                    Object.entries(content).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            section.ele(key).txt(String(value));
                        }
                    });
                }

                section.up();
            });
        }

        return doc.end(SERIALIZATION_OPTIONS);
    } catch (error) {
        throw new Error(`XML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Валідує XML рядок на правильність структури
 * @param xml - XML рядок для валідації
 * @returns true якщо XML валідний
 */
export function isValidXML(xml: string): boolean {
    try {
        const doc = create(xml);
        return doc !== null;
    } catch {
        return false;
    }
}

/**
 * Витягує значення елемента з XML
 * @param xml - XML рядок
 * @param elementName - Назва елемента
 * @returns Значення елемента або null
 */
export function extractElementValue(xml: string, elementName: string): string | null {
    try {
        const regex = new RegExp(`<${elementName}>(.*?)</${elementName}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Конвертує об'єкт в XML елементи (утіліта)
 * @param obj - Об'єкт для конвертації
 * @returns Масив XML елементів
 */
export function objectToXMLElements(obj: Record<string, any>): Array<{ name: string; value: string }> {
    return Object.entries(obj)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([name, value]) => ({ name, value: String(value) }));
}
