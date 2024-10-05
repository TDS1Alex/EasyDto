import { MultiplicityDict } from "../dictionaries/multiplicity-dict";
import { TypeDict } from "../dictionaries/type-dict";
import { Parameter } from "../class/parameter";
import { Class } from "../class/class";
import { Multiplicity } from "../class/multiplicity";
import { Enum } from "../class/enum";

export class CreateClassOrParameterService {

    public static createDefaultClass(name: string): Class {
        return new Class(name ? name : "DefaultName", false, Multiplicity.Singular, 0);
    }
    
    public static createClass(parts: string[], level: number): Class {
        const name = CreateClassOrParameterService.getName(parts, 'объект');
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = this.getMultiplicity(parts);

        return new Class(name, required, multiplicity, level);
    }

    public static createEnum(parts: string[]): Enum {
        const name = CreateClassOrParameterService.getName(parts, 'перечисление');
        const required = parts.some(p => RegExp("^1").test(p));
        const multiplicity = this.getMultiplicity(parts);

        return new Enum(name, required, multiplicity);
    }

    public static createParameter(parts: string[]): Parameter {
        const multiplicityKeyIndex = parts.findIndex(e => MultiplicityDict[e]);       
        parts = parts.slice(0, multiplicityKeyIndex + 1);

        this.combineDateTimeParts(parts);

        const multiplicity = this.getMultiplicity(parts);
        const maxLenght = this.getMaxLenght(parts);

        const typeKey = [...parts].reverse().find(e => TypeDict[e])!;
        const type = TypeDict[typeKey];
        
        const name = this.getName(parts, typeKey);
        const required = parts.some(p => RegExp("^1").test(p));
        
        return new Parameter(name, required, multiplicity, type, maxLenght);
    }

    private static combineDateTimeParts(parts: string[]) {
        const i = parts.indexOf("время");
        if (i !== -1 && parts[i - 1] === "и" && parts[i - 2] === "дата") {
            parts[i] = "дата и время";
            parts.splice(i - 2, 2);   
        }
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
}