import { Class } from "../../class/class";
import { Multiplicity } from "../../class/multiplicity";
import { Type } from "../../class/type";
import { JavaScriptTypeDict } from "./javascript-type-dict";

export class JavaScriptMapper {
    public static generateJavaScriptDto(currentClass: Class, dtoText: string) {
        const isObjectExist = currentClass.objects && currentClass.objects.length != 0;
        const isEnumExist = currentClass.enums && currentClass.enums.length != 0;

        dtoText = `export class ${currentClass.name} {\n`;

        currentClass.parameters.forEach(param => {
            const isCollection = param.multiplicity === Multiplicity.Collection;
            dtoText += this.getProperty(param.name, param.required, isCollection, false, param.type);
            dtoText = this.lineBreak(currentClass.parameters, param, dtoText, !isObjectExist && !isEnumExist);
        });

        if (isEnumExist) {
            dtoText += '\n';
            currentClass.enums.forEach(currentEnum => {
                const isCollection = currentEnum.multiplicity === Multiplicity.Collection;
                dtoText += this.getProperty(currentEnum.name, currentEnum.required, isCollection, true);
                dtoText = this.lineBreak(currentClass.enums, currentEnum, dtoText, true);
            });
        }

        if (isObjectExist) {
            dtoText += '\n';
            currentClass.objects.forEach(object => {
                const isCollection = object.multiplicity === Multiplicity.Collection;
                dtoText += this.getProperty(object.name, object.required, isCollection, true);
                dtoText = this.lineBreak(currentClass.objects, object, dtoText, true);
            });
        }

        dtoText += `}\n\n`;
        return dtoText;
    }

    private static getProperty(name: string, isRequired: boolean, isCollection: boolean, isObject: boolean, type: Type | null = null) {
        const indent = '    ';
        const brackets = isCollection ? `[]` : '';
        const objectSingular = isObject ? `${name}` : null;
        const parameterType = !isObject && type ? `${JavaScriptTypeDict[type!]}` : null;
        const isOptionalField = !isRequired && !isCollection? "?" : "";
        const types = [objectSingular, parameterType].filter(Boolean);

        return `${indent}${name}${isOptionalField}: ${types}${brackets};`;
    }

    private static lineBreak<T>(entities: T[], currentEntity: T, text: string, needLineBreak: boolean): string {
        const currentEntityIndex = entities.findIndex(p => p === currentEntity);
        if (currentEntityIndex !== entities?.length - 1 ||
            currentEntityIndex === entities?.length - 1 && needLineBreak) {
            text += '\n';
        }
        return text;
    }
}