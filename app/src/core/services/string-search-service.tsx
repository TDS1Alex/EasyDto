import { Multiplicity, MultiplicityDict, TypeDict, ValidationResult } from "../models";

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
        Части строки валидны, если множественность и тип находятся рядом.
    */
    public static validParts(parts: string[]): ValidationResult {
        const validationResult = new ValidationResult();
        let i = parts.findIndex(part => TypeDict[part]) ?? 0;

        for(i; i < parts.length; i++) {
            const part = parts[i];
            const type = TypeDict[part];
            const name = type ? parts[i-1] : part;
            const multiplicity = type ? MultiplicityDict[parts[i+1]] : MultiplicityDict[part];

            if (type) {
                validationResult.isTypeValid = true;
            }

            if (multiplicity) {
                validationResult.isMultiplicityValid = true;
            }

            if (name && type && multiplicity) {
                validationResult.isNameValid = true;
            } else if (!name && type && multiplicity) {
                validationResult.isNameValid = false;
                return validationResult;
            } else if (name && type && !multiplicity) {
                validationResult.isNameValid = true;
                return validationResult;
            } else if (name && !type && !multiplicity) {
                validationResult.isNameValid = true;
                return validationResult;
            }
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
        Получение названия свойства из частей строки.
        Ищем название рядом с типом.
    */
    public static getName(parts: string[], typeKey: string): string {
        const i = parts.lastIndexOf(typeKey);
        return parts.slice(0, i).join(' ').replace(/-/g, '').trim();
    }
}