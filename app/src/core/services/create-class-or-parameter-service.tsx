import { Class, Parameter, Enum, Multiplicity, MultiplicityDict } from "../models";
import { normalizeRuleSource, type RuleMap } from "../rules/rule-set";
import { AiService } from "./ai-service";
import { StringSearchService } from "./string-search-service";

export class CreateClassOrParameterService {

    public static async createDefaultClass(comment: string, rules?: RuleMap): Promise<Class> {
        if (comment) {
            const ruleName = rules?.get(normalizeRuleSource(comment));
            if (ruleName) {
                return new Class(ruleName, false, Multiplicity.Singular, comment, 0);
            }

            let translatedName = await AiService.translateName(comment);
            translatedName = this.mergeWords(translatedName);
            return new Class(translatedName, false, Multiplicity.Singular, comment, 0);
        }
        return new Class("DefaultName", false, Multiplicity.Singular, "DefaultName", 0);
    }

    public static async createClass(parts: string[], level: number, isNameExist: boolean, rules?: RuleMap): Promise<Class> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);

        const comment = StringSearchService.getComment(parts, 'объект');
        const name = await this.GetName(isNameExist, parts, multiplicityKeyIndex, comment, rules);
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = StringSearchService.getMultiplicity(parts);

        return new Class(name, required, multiplicity, comment, level);
    }

    public static async createEnum(parts: string[], isNameExist: boolean, rules?: RuleMap): Promise<Enum> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);

        const comment = StringSearchService.getComment(parts, 'перечисление');
        const name = await this.GetName(isNameExist, parts, multiplicityKeyIndex, comment, rules);
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = StringSearchService.getMultiplicity(parts);

        return new Enum(name, required, multiplicity, comment);
    }

    public static async createParameter(parts: string[], isNameExist: boolean, rules?: RuleMap): Promise<Parameter> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);
        const typeMatch = StringSearchService.findType(parts);

        if (multiplicityKeyIndex < 0 || !typeMatch) {
            throw new Error(`Не удалось определить тип или множественность: ${parts.join(' ')}`);
        }

        const afterKeyCount = isNameExist ? 2 : 1;
        const filteredParts = parts.slice(0, multiplicityKeyIndex + afterKeyCount);

        const multiplicity = StringSearchService.getMultiplicity(parts);
        const maxLenght = StringSearchService.getMaxLenght(filteredParts);
        const type = typeMatch.type;
        const comment = StringSearchService.getComment(parts, typeMatch.index);
        const name = await this.GetName(isNameExist, parts, multiplicityKeyIndex, comment, rules);

        const required = filteredParts.some(p => RegExp("^1").test(p));

        return new Parameter(name, required, multiplicity, type, maxLenght, comment);
    }

    /*
        Приоритет: явное имя → правило из набора → перевод ИИ.
    */
    private static async GetName(
        isNameExist: boolean,
        parts: string[],
        multiplicityKeyIndex: number,
        comment: string,
        rules?: RuleMap,
    ): Promise<string> {
        const explicitName = parts[multiplicityKeyIndex + 1];
        if (isNameExist && explicitName) {
            return explicitName;
        }

        const ruleName = rules?.get(normalizeRuleSource(comment));
        if (ruleName) {
            return ruleName;
        }

        const translatedName = await AiService.translateName(comment);
        return this.mergeWords(translatedName);
    }

    private static mergeWords(translatedName: string): string {
        let words = translatedName.split(' ');
        words = this.removeArticles(words);
        words = this.setCapitalLetter(words);
        translatedName = words.join('');
        return this.removePunctuationMarks(translatedName);
    }

    private static removeArticles(words: string[]): string[] {
        const articles: string[] = ["a", "an", "the", "is", "to", "of"];
        return words.filter(word => !articles.includes(word.toLowerCase()));
    }

    private static setCapitalLetter(words: string[]): string[] {
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    }

    private static removePunctuationMarks(word: string): string {
        return word.replace(/[.,?!]/g, '');
    }
}
