import { Class } from "../../class/class";
import { Multiplicity } from "../../class/multiplicity";
import { Parameter } from "../../class/parameter";
import { Type } from "../../class/type";
import { JavaScriptTypeDict } from "./javascript-type-dict";

export class JavaScriptMapper {
    public static generateJavaScriptDto(currentClass: Class, dtoText: string) {
        dtoText = `export class ${currentClass.name} {\n`;
        dtoText = this.generateParameters(currentClass.parameters, dtoText);

        if (currentClass.objects) {
            dtoText = this.generateObjects(currentClass.objects, dtoText);
        }

        dtoText += `}\n\n`;
        return dtoText;
    }

    private static generateParameters(parameters: Parameter[], dtoText: string): string {
        parameters.forEach(param => {
            const isCollection = param.multiplicity === Multiplicity.Collection;
            dtoText += this.getProperty(param.name, isCollection, false, param.type);
            dtoText = this.lineBreak(parameters, param, dtoText, false);
        });

        return dtoText;
    }

    private static generateObjects(objects: Class[], dtoText: string): string {
        dtoText += '\n';
        objects.forEach(object => {
            const isCollection = object.multiplicity === Multiplicity.Collection;
            dtoText += this.getProperty(object.name, isCollection, true);
            dtoText = this.lineBreak(objects, object, dtoText, true);
        });

        return dtoText;
    }

    private static getProperty(name: string, isCollection: boolean, isObject: boolean, type: Type | null = null) {
        const indent = '    ';
        const brackets = isCollection ? `[]` : '';
        const objectSingular = isObject ? `${name}` : null;
        const parameterType = !isObject && type ? `${JavaScriptTypeDict[type!]}` : null;
        const types = [objectSingular, parameterType].filter(Boolean);

        return `${indent}${name}: ${types}${brackets};`;
    }

    private static lineBreak<T>(entities: T[], currentEntity: T, text: string, isObject: boolean): string {
        const currentEntityIndex = entities.findIndex(p => p === currentEntity);
        if (currentEntityIndex !== entities?.length - 1 || 
            currentEntityIndex === entities?.length - 1 && isObject) {
            text += '\n';
        }
        return text;
    }
}