import { Attribute } from "../../class/attribute";
import { Class } from "../../class/class";
import { Multiplicity } from "../../class/multiplicity";
import { Type } from "../../class/type";
import { CSharpTypeDict } from "./csharp-type-dict";

export class CSharpMapper {
    public static generateCSharpDto(currentClass: Class, dtoText: string) {
        dtoText = `public class ${currentClass.name}\n{\n`;
        dtoText = this.generateParameters(currentClass, dtoText);

        if (currentClass.objects) {
            dtoText = this.generateObjects(currentClass, dtoText);
        }

        dtoText += `}\n\n`;
        return dtoText;
    }

    private static generateParameters(currentClass: Class, dtoText: string): string {
        currentClass.parameters.forEach(param => {        
            const isCollection = param.multiplicity === Multiplicity.Collection;
            const isIgnore = param.type === Type.Number;
            const attribute = new Attribute(param.required, isCollection, false, isIgnore, param.maxLenght);
            
            dtoText += attribute.getAttribute();
            let propertyText = this.getProperty(param.name, isCollection, false, param.type);
            propertyText = this.lineBreak(currentClass.parameters, param, propertyText);

            dtoText += propertyText;
        });

        return dtoText;
    }

    private static generateObjects(currentClass: Class, dtoText: string): string {
        dtoText += '\n';
        currentClass.objects.forEach(object => {
            const isCollection = object.multiplicity === Multiplicity.Collection;
            const attribute = new Attribute(object.required, isCollection, true, false, null);

            dtoText += attribute.getAttribute();
            dtoText += this.getProperty(object.name, isCollection, true);
            dtoText = this.lineBreak(currentClass.objects, object, dtoText);
        });

        return dtoText;
    }

    private static getProperty(name: string, isCollection: boolean, isObject: boolean, type: Type | null = null) {
        const indent = '    ';
        const objectCollection = isObject && isCollection ? `ICollection<${name}>` : null;
        const objectSingular = isObject && !isCollection ? `${name}` : null;
        const parameterType = !isObject && type ? `${CSharpTypeDict[type!]}` : null;
        const types = [objectCollection, objectSingular, parameterType].filter(Boolean);

        return `${indent}public ${types} ${name} { get; set; }\n`;
    }

    private static lineBreak<T>(entities: T[], currentEntity: T, text: string):string {
        const currentEntityIndex = entities.findIndex(p => p === currentEntity);
        if (currentEntityIndex !== entities?.length - 1) {
            text += '\n';
        }
        return text;
    }
}