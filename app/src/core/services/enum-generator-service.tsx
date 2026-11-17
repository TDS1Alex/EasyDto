import { Enum, Multiplicity, Technology } from '../models';
import type { RuleMap } from '../rules/rule-set';
import { CreateClassOrParameterService } from './create-class-or-parameter-service';
import { EnumService, type EnumTable } from './enum-service';
import { GenerateDtoService } from './generate-dto-service';

export interface EnumGenerationOptions {
    technology: Technology;
    needComments: boolean;
    explicitName?: string;
    rules?: RuleMap;
}

export interface EnumGenerationResult {
    enums: Enum[];
    code: string;
    tables: EnumTable[];
    warnings: string[];
}

/*
    Генерация перечислений вынесена из генератора DTO:
    на вход подаются только таблицы значений, на выходе — код enum.
*/
export class EnumGeneratorService {
    public static parseTables(input: string): EnumTable[] {
        if (input.trim() === '') {
            return [];
        }

        return EnumService.extractTables(input.split(/\r?\n/)).tables;
    }

    public static async generate(
        input: string,
        options: EnumGenerationOptions,
    ): Promise<EnumGenerationResult> {
        const tables = this.parseTables(input);
        const warnings: string[] = [];
        const enums: Enum[] = [];

        if (tables.length === 0) {
            return { enums, code: '', tables, warnings };
        }

        const explicitName = options.explicitName?.trim() ?? '';

        for (let index = 0; index < tables.length; index++) {
            const table = tables[index];
            const tableName = tables.length === 1 ? explicitName : '';

            try {
                enums.push(await CreateClassOrParameterService.createEnumFromTable(
                    table.title,
                    table.values,
                    tableName,
                    options.rules,
                ));
            } catch {
                const fallbackName = this.getFallbackName(table, index);
                warnings.push(
                    `Не удалось перевести название «${table.title || 'без заголовка'}». `
                    + `Использовано имя ${fallbackName}.`,
                );

                enums.push(new Enum(
                    fallbackName,
                    false,
                    Multiplicity.Singular,
                    EnumService.getEnumComment(table.title),
                    table.values,
                ));
            }
        }

        return {
            enums,
            code: GenerateDtoService.generateAllEnums(
                enums,
                options.technology,
                options.needComments,
            ),
            tables,
            warnings,
        };
    }

    private static getFallbackName(table: EnumTable, index: number): string {
        const title = EnumService.getEnumComment(table.title);
        const latinWords = title.match(/[A-Za-z][A-Za-z0-9]*/g);

        if (latinWords && latinWords.length > 0) {
            return latinWords
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
        }

        return index === 0 ? 'Enum' : `Enum${index + 1}`;
    }
}
