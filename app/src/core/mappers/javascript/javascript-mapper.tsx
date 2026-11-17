import { Class, Enum, Multiplicity, Type } from "../../models";
import { JavaScriptTypeDict } from "./javascript-type-dict";

export class JavaScriptMapper {
    public static generateJavaScriptDto(currentClass: Class, dtoText: string,
        includeEnumDeclarations: boolean = true) {
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

        if (includeEnumDeclarations && isEnumExist) {
            dtoText += this.generateEnumDeclarations(currentClass.enums);
        }

        return dtoText;
    }

    /*
        Генерация только перечислений — используется, когда на вход
        подана одна таблица перечисления без описания DTO.
    */
    public static generateJavaScriptEnums(enums: Enum[]): string {
        return this.generateEnumDeclarations(enums);
    }

    private static generateEnumDeclarations(enums: Enum[]): string {
        let dtoText = '';

        enums.forEach(currentEnum => {
            dtoText += `export enum ${currentEnum.name} {\n`;

            currentEnum.values.forEach((value, index) => {
                dtoText += `    ${value.name} = ${value.value}`;
                dtoText += index !== currentEnum.values.length - 1 ? ',\n' : '\n';
            });

            dtoText += `}\n\n`;
        });

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