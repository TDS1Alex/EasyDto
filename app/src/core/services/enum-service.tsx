import { EnumValue } from "../models";

export interface EnumTable {
    title: string;
    values: EnumValue[];
}

/*
    Разбор таблиц перечислений из системы СА.

    Строка таблицы выглядит так:
        0    Undefined    Не определен

    Первое число — номер строки в таблице, он игнорируется.
    Имя значения — латинский идентификатор, описание — произвольный текст.
*/
export class EnumService {
    private static readonly enumRowRegex = /^\s*\d+\.?\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+(.*\S))?\s*$/;

    /*
        Проверяет, является ли строка строкой таблицы перечисления.
        Используется как защита, чтобы такие строки не попали в разбор DTO.
    */
    public static isEnumValueRow(line: string): boolean {
        return this.enumRowRegex.test(line);
    }

    /*
        Получает описание перечисления из заголовка таблицы.
        Код вида «М-Э-101» в начале заголовка отбрасывается.
    */
    public static getEnumComment(title: string): string {
        const parts = title.trim().split(/\s+/).filter(part => part !== '');
        if (parts.length > 1
            && /\d/.test(parts[0])
            && /^[\p{L}\p{N}.-]+$/u.test(parts[0])) {
            return parts.slice(1).join(' ');
        }

        return title.trim();
    }

    /*
        Выделяет строки таблиц перечислений из общего текста.
        Возвращает оставшиеся строки для разбора структуры и сами таблицы.
    */
    public static extractTables(lines: string[]): { lines: string[]; tables: EnumTable[] } {
        const tables: EnumTable[] = [];
        const contentLines: string[] = [];
        let index = 0;

        while (index < lines.length) {
            if (!this.enumRowRegex.test(lines[index])) {
                contentLines.push(lines[index]);
                index++;
                continue;
            }

            const values: EnumValue[] = [];
            while (index < lines.length) {
                const match = this.enumRowRegex.exec(lines[index]);
                if (!match) {
                    break;
                }

                values.push(new EnumValue(match[1], match[2]?.trim() || null));
                index++;
            }

            tables.push({
                title: this.findTitle(contentLines),
                values,
            });
        }

        return { lines: contentLines, tables };
    }

    /*
        Находит таблицу, заголовок которой соответствует описанию перечисления.
        Заголовком считается ближайшая непустая строка перед таблицей:
        либо отдельный заголовок «М-Э-101 ...», либо строка объявления перечисления.
    */
    public static takeValuesForComment(comment: string, tables: EnumTable[]): EnumValue[] {
        const normalizedComment = this.normalize(comment);
        if (normalizedComment === '') {
            return [];
        }

        const table = tables.find(item => {
            const normalizedTitle = this.normalize(item.title);
            if (normalizedTitle === '') {
                return false;
            }

            return normalizedTitle.includes(normalizedComment)
                || normalizedComment.includes(normalizedTitle);
        });

        return table ? table.values : [];
    }

    private static findTitle(lines: string[]): string {
        for (let index = lines.length - 1; index >= 0; index--) {
            const line = lines[index].trim();
            if (line !== '') {
                return line;
            }
        }

        return '';
    }

    private static normalize(value: string): string {
        return value
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
