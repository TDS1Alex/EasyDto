import { Multiplicity, MultiplicityDict, Type, TypeDict, ValidationResult } from "../models";

export interface TypeMatch {
    index: number;
    length: number;
    type: Type;
}

export class StringSearchService {
    //Получаем аттрибут максимальной длины из частей строки.
    public static getMaxLenght(parts: string[]): number | null {
        const regex = new RegExp(/\(([0-9]+)\)/);
        let maxLenght = null;
        const line = parts.join(" ");

        if (regex.test(line)) {
            const match = regex.exec(line)!;
            maxLenght = Number.parseInt(match[1]);

            const i = parts.findIndex(element => regex.test(element));
            parts[i] = parts[i].replace(regex, '');
        }
        return maxLenght;
    }

    /*
        Тип определяется по слову перед множественностью.
        Это позволяет использовать слова-типы в описании, например
        «дата создания дата и время 1 createdAt».
    */
    public static findType(parts: string[]): TypeMatch | null {
        const multiplicityIndex = parts.findIndex(part => MultiplicityDict[part]);

        if (multiplicityIndex > 0) {
            const match = this.matchTypeEndingAt(parts, multiplicityIndex - 1);
            if (match) {
                return match;
            }
        }

        // Строка без множественности: тип может находиться в конце
        // (используется при склейке разорванных строк).
        return this.matchTypeEndingAt(parts, parts.length - 1);
    }

    private static matchTypeEndingAt(parts: string[], end: number): TypeMatch | null {
        let index = end;

        while (index >= 0 && /^\(\d+\)$/.test(parts[index])) {
            index--;
        }

        if (index >= 2 && parts[index - 2] === "дата" && parts[index - 1] === "и" && parts[index] === "время") {
            return { index: index - 2, length: 3, type: Type.DateTime };
        }

        const type = index >= 0 ? TypeDict[parts[index]] : undefined;
        return type ? { index, length: 1, type } : null;
    }

    /*
        Части строки валидны, если найдены тип и множественность.
    */
    public static validParts(parts: string[]): ValidationResult {
        const validationResult = new ValidationResult();
        const typeMatch = this.findType(parts);
        const multiplicityIndex = parts.findIndex(part => MultiplicityDict[part]);

        validationResult.isTypeValid = typeMatch !== null;
        validationResult.isMultiplicityValid = multiplicityIndex >= 0;

        if (typeMatch) {
            const beforeType = parts
                .slice(0, typeMatch.index)
                .filter(part => part !== "-");

            validationResult.isNameValid = beforeType.length > 0;
        } else {
            validationResult.isNameValid = parts.some(part =>
                part !== "-" && !MultiplicityDict[part],
            );
        }

        return validationResult;
    }

    /*
        Получение множественности из частей строки.
        Множественность должна быть обязательно.
    */
    public static getMultiplicity(parts: string[]): Multiplicity {
        const multiplicityKey = parts.find(e => MultiplicityDict[e])!;
        return MultiplicityDict[multiplicityKey];
    }

    /*
        Получение описания из частей строки — всё, что стоит до типа.
        Можно передать как ключевое слово, так и индекс его начала.
    */
    public static getComment(parts: string[], typeKeyOrIndex: string | number): string {
        const index = typeof typeKeyOrIndex === 'number'
            ? typeKeyOrIndex
            : parts.indexOf(typeKeyOrIndex);
        const end = index < 0 ? parts.length : index;
        return parts.slice(0, end).join(' ').replace(/-/g, '').trim();
    }
}
