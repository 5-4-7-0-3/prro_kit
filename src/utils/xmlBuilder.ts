import { create } from 'xmlbuilder2';

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
        // Build XML manually to avoid xmlbuilder2 namespace issues
        let xml = `<?xml version="1.0" encoding="windows-1251"?>`;
        xml += `<${rootName} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="${rootName.toLowerCase()}01.xsd">`;
        
        // Add header
        xml += `<${headTag}>`;
        Object.entries(headData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                xml += `<${key}>${escapeXml(String(value))}</${key}>`;
            }
        });
        xml += `</${headTag}>`;
        
        if (bodySections) {
            Object.entries(bodySections).forEach(([sectionName, content]) => {
                xml += `<${sectionName}>`;
                
                if (Array.isArray(content)) {
                    content.forEach((item) => {
                        xml += '<ROW>';
                        Object.entries(item).forEach(([field, val]) => {
                            if (val !== undefined && val !== null) {
                                xml += `<${field}>${escapeXml(String(val))}</${field}>`;
                            }
                        });
                        xml += '</ROW>';
                    });
                } else if (typeof content === 'object' && content !== null) {
                    Object.entries(content).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            xml += `<${key}>${escapeXml(String(value))}</${key}>`;
                        }
                    });
                }
                
                xml += `</${sectionName}>`;
            });
        }
        
        xml += `</${rootName}>`;
        return xml;
    } catch (error) {
        throw new Error(`XML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Валідує XML рядок на правильність структури
 * @param xml - XML рядок для валідації
 * @returns true якщо XML валідний
 */
export function isValidXML(xml: string): boolean {
    try {
        // Simple XML validation - check for basic structure
        const hasXmlDeclaration = xml.startsWith('<?xml');
        const hasClosingTags = xml.split('<').length === xml.split('>').length;
        
        // Check for balanced tags using a simple regex
        const tagPattern = /<(\w+)(?:\s[^>]*)?>(?:.*?)<\/\1>/;
        
        return hasXmlDeclaration && hasClosingTags;
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