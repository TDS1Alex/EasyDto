import { Class, Parameter, Enum, Multiplicity, TypeDict, MultiplicityDict } from "../models";
import { AiService } from "./ai-service";

export class CreateClassOrParameterService {

    public static async createDefaultClass(name: string): Promise<Class> { 
        if(name) {
            
            let translatedName = await AiService.translateName(name);
            translatedName = this.mergeWords(translatedName);
            return new Class(name, translatedName, false, Multiplicity.Singular, 0);
        }
        return new Class("DefaultName", "DefaultName", false, Multiplicity.Singular, 0);
    }
    
    public static async createClass(parts: string[], level: number): Promise<Class> {
        const name = CreateClassOrParameterService.getName(parts, 'объект');    
        let translatedName = await AiService.translateName(name);
        translatedName = this.mergeWords(translatedName);;
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = this.getMultiplicity(parts);
        
        return new Class(name, translatedName, required, multiplicity, level);
    }

    public static async createEnum(parts: string[]): Promise<Enum> {
        const name = CreateClassOrParameterService.getName(parts, 'перечисление');
        let translatedName = await AiService.translateName(name);
        translatedName = this.mergeWords(translatedName);

        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = this.getMultiplicity(parts);
        
        return new Enum(name, translatedName, required, multiplicity);
    }

    public static async createParameter(parts: string[]): Promise<Parameter> {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);
        parts = parts.slice(0, multiplicityKeyIndex + 1);

        const dateTimeType = this.combineDateTimeParts(parts);

        const multiplicity = this.getMultiplicity(parts);
        const maxLenght = this.getMaxLenght(parts);

        const typeKey = [...parts].reverse().find(e => TypeDict[e])!;
        const type = dateTimeType ? dateTimeType : TypeDict[typeKey] ;  
             
        const name = this.getName(parts, typeKey);
        let translatedName = await AiService.translateName(name);
        translatedName = this.mergeWords(translatedName);
        const required = parts.some(p => RegExp("^1").test(p));

        return new Parameter(name, translatedName, required, multiplicity, type, maxLenght);
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

    private static getMaxLenght(parts: string[]) {
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

    private static getName(elements: string[], typeKey: string): string {
        const i = elements.lastIndexOf(typeKey);
        return elements.slice(0, i).join(' ').replace(/-/g, '').trim();
    }

    private static getMultiplicity(parts: string[]): Multiplicity {
        const multiplicityKey = parts.find(e => MultiplicityDict[e])!;
        return MultiplicityDict[multiplicityKey];
    }

    private static mergeWords(translatedName: string): string {
        let words = translatedName.split(' ');
        words = this.removeArticles(words);
        words = this.setCapitalLetter(words);
        translatedName = words.join('');
        return this.removePunctuationMarks(translatedName);
    }

    private static removeArticles(words: string[]): string[] {
        const articles : string[] = ["a", "an", "the", "is"];
        return words.filter(word => !articles.includes(word.toLowerCase()));
    }

    private static setCapitalLetter(words: string[]): string[] {
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    }

    private static removePunctuationMarks(word: string): string {
        return word.replace(/[.,?!]/g, '');
    }
}