import { Multiplicity, MultiplicityDict, TypeDict } from "../models";

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
        TODO: добавить в валидацию наличие названия поля.
    */
    public static validParts(parts: string[]): boolean {
        for(let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (MultiplicityDict[part] && TypeDict[parts[i-1]]) {
                return true;
            }
        }
        return false;
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