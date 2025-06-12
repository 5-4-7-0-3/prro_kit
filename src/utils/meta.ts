import { v4 as uuidv4 } from 'uuid';
import { getDateTime } from './dateTimeKit';
import type { CreateMetaOptions, MetaData } from '../types';

/**
 * Генерує метадані для фіскального документа
 * @param {CreateMetaOptions} [opts={}] - Опції генерації
 * @returns {MetaData} Об'єкт метаданих
 */
export function createMeta(opts: CreateMetaOptions = {}): MetaData {
    const { isTestMode = false, uuidFn = uuidv4, timeZone, isoString } = opts;

    return {
        uid: uuidFn(),
        date: getDateTime({ format: 'dateNumeric', timeZone, isoString }),
        time: getDateTime({ format: 'timeNumeric', timeZone, isoString }),
        testing: isTestMode,
    };
}
