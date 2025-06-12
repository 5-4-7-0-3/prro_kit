import { create } from 'xmlbuilder2';

const XML_OPTIONS = {
    version: '1.0',
    encoding: 'windows-1251',
} as const;

/**
 * Створює XML-документ з вказаною структурою
 * @param {string} rootName - Назва кореневого елементу
 * @param {string} headTag - Назва тегу заголовка
 * @param {Record<string, any>} headData - Дані заголовка
 * @param {Record<string, any>} [bodySections] - Секції тіла документа
 * @returns {string} Згенерований XML
 */
export function buildXml(
    rootName: string,
    headTag: string,
    headData: Record<string, any>,
    bodySections?: Record<string, any>,
): string {
    const doc = create(XML_OPTIONS).ele(rootName, {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': `${rootName.toLowerCase()}01.xsd`,
    });

    // Додавання заголовка
    const head = doc.ele(headTag);
    Object.entries(headData).forEach(([key, value]) => {
        head.ele(key).txt(String(value));
    });
    head.up();

    if (bodySections) {
        Object.entries(bodySections).forEach(([sectionName, content]) => {
            const section = doc.ele(sectionName);

            if (Array.isArray(content)) {
                content.forEach((item) => {
                    const row = section.ele('ROW');
                    Object.entries(item).forEach(([field, val]) => {
                        row.ele(field).txt(String(val));
                    });
                });
            } else {
                Object.entries(content).forEach(([key, value]) => {
                    section.ele(key).txt(String(value));
                });
            }

            section.up();
        });
    }

    return doc.end({ prettyPrint: false });
}
