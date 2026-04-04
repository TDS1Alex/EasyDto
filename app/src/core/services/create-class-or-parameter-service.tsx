import { Class, Parameter, Enum, Multiplicity, TypeDict, MultiplicityDict } from "../models";
import { AiService } from "./ai-service";
import { StringSearchService } from "./string-search-service";

export class CreateClassOrParameterService {

    public static async createDefaultClass(comment: string): Promise<Class> { 
        if(comment) {
            
            let translatedName = await AiService.translateName(comment);
            translatedName = this.mergeWords(translatedName);
            return new Class(translatedName,  false, Multiplicity.Singular, comment, 0);
        }
        return new Class("DefaultName", false, Multiplicity.Singular, "DefaultName", 0);
    }
    
    public static async createClass(parts: string[], level: number, isNameExist: boolean): Promise<Class> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);

        const comment = StringSearchService.getComment(parts, 'объект');   
        const name = await this.GetName(isNameExist, parts, multiplicityKeyIndex, comment);
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = StringSearchService.getMultiplicity(parts);
        
        return new Class(name, required, multiplicity, comment, level);
    }

    public static async createEnum(parts: string[], isNameExist: boolean): Promise<Enum> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);

        const comment = StringSearchService.getComment(parts, 'перечисление');
        const name = await this.GetName(isNameExist, parts, multiplicityKeyIndex, comment);
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = StringSearchService.getMultiplicity(parts);
        
        return new Enum(name, required, multiplicity, comment);
    }

    public static async createParameter(parts: string[], isNameExist: boolean): Promise<Parameter> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);
        const afterKeyCount = isNameExist ? 2 : 1;
        let filteredParts = parts.slice(0, multiplicityKeyIndex + afterKeyCount);
     
        const multiplicity = StringSearchService.getMultiplicity(filteredParts);
        const maxLenght = StringSearchService.getMaxLenght(filteredParts);

        const typeKey = [...filteredParts].reverse().find(e => TypeDict[e])!;

        const dateTimeType = this.combineDateTimeParts(filteredParts);
        const type = dateTimeType ? dateTimeType : TypeDict[typeKey];

        const comment = StringSearchService.getComment(filteredParts, typeKey);
        const name = await this.GetName(isNameExist, parts, multiplicityKeyIndex, comment);

        const required = filteredParts.some(p => RegExp("^1").test(p));

        return new Parameter(name, required, multiplicity, type, maxLenght, comment);
    }

    private static async GetName(isNameExist: boolean, parts: string[], multiplicityKeyIndex: number, comment: string): Promise<string> {
        if (isNameExist) {
            return parts[multiplicityKeyIndex + 1];
        }
        else {
            let translatedName = await AiService.translateName(comment);
            return this.mergeWords(translatedName);
        }
    }

    private static combineDateTimeParts(parts: string[]) {
        const i = parts.indexOf("время");
        if (i !== -1 && parts[i - 1] === "и" && parts[i - 2] === "дата") {
            parts[i] = "дата и время";
            parts.splice(i - 2, 2);
            return TypeDict[parts[i]];
        }
        return null;
    }

    private static mergeWords(translatedName: string): string {
        let words = translatedName.split(' ');
        words = this.removeArticles(words);
        words = this.setCapitalLetter(words);
        translatedName = words.join('');
        return this.removePunctuationMarks(translatedName);
    }

    private static removeArticles(words: string[]): string[] {
        const articles : string[] = ["a", "an", "the", "is", "to", "of"];
        return words.filter(word => !articles.includes(word.toLowerCase()));
    }

    private static setCapitalLetter(words: string[]): string[] {
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    }

    private static removePunctuationMarks(word: string): string {
        return word.replace(/[.,?!]/g, '');
    }
}