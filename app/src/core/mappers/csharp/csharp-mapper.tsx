import { Class, Parameter, Enum, Type, Multiplicity, Attribute } from "../../models";
import { CSharpTypeDict } from "./csharp-type-dict";

export class CSharpMapper {
    public static generateCSharpDto(currentClass: Class, dtoText: string, needComments: boolean,
        includeEnumDeclarations: boolean = true) {

        if (needComments) {
            let className: string = `/// <summary>\n`;
            className += `/// ${currentClass.comment}\n`;
            className += `/// </summary>\n`;
            className += `public class ${currentClass.name}\n{\n`;
            dtoText = className;
        } else {
            dtoText = `public class ${currentClass.name}\n{\n`;
        }
        
        dtoText = this.generateParameters(currentClass.parameters, dtoText, needComments);

        if (currentClass.enums && currentClass.enums.length != 0) {
            dtoText = this.generateEnums(currentClass.enums, dtoText, needComments);
        }

        if (currentClass.objects && currentClass.objects.length != 0) {
            dtoText = this.generateObjects(currentClass.objects, dtoText, needComments);
        }

        dtoText += `}\n\n`;

        if (includeEnumDeclarations && currentClass.enums && currentClass.enums.length != 0) {
            dtoText = this.generateEnumDeclarations(currentClass.enums, dtoText, needComments);
        }

        return dtoText;
    }

    /*
        Генерация только перечислений — используется, когда на вход
        подана одна таблица перечисления без описания DTO.
    */
    public static generateCSharpEnums(enums: Enum[], needComments: boolean): string {
        return this.generateEnumDeclarations(enums, '', needComments);
    }

    private static generateParameters(parameters: Parameter[], dtoText: string, needComments: boolean): string {
        parameters.forEach(param => {
            const isCollection = param.multiplicity === Multiplicity.Collection;
            const isIgnore = param.type !== Type.String;
            const attribute = new Attribute(param.required, isCollection, false, isIgnore, param.maxLenght);

            if (needComments) {
                dtoText = this.getComment(param.comment, dtoText);
            }
            
            dtoText += attribute.getAttribute();
            dtoText += this.getProperty(param.name, param.required, isCollection, false, false, param.type);
            dtoText = this.lineBreak(parameters, param, dtoText);
        });

        return dtoText;
    }

    private static generateObjects(objects: Class[], dtoText: string, needComments: boolean): string {
        dtoText += '\n';
        objects.forEach(object => {
            const isCollection = object.multiplicity === Multiplicity.Collection;
            const attribute = new Attribute(object.required, isCollection, true, false);

            if (needComments) {
                dtoText = this.getComment(object.comment, dtoText);
            }
          
            dtoText += attribute.getAttribute();
            dtoText += this.getProperty(object.name, true, isCollection, true);
            dtoText = this.lineBreak(objects, object, dtoText);
        });

        return dtoText;
    }

    private static generateEnums(enums: Enum[], dtoText: string, needComments: boolean): string {
        dtoText += '\n';
        enums.forEach(currentEnum => {
            const isCollection = currentEnum.multiplicity === Multiplicity.Collection;
            const attribute = new Attribute(currentEnum.required, isCollection, true, false);

            if (needComments) {
                dtoText = this.getComment(currentEnum.comment, dtoText);
            }

            dtoText += attribute.getAttribute();
            dtoText += this.getProperty(currentEnum.name, currentEnum.required, isCollection, false, true);
            dtoText = this.lineBreak(enums, currentEnum, dtoText);
        });

        return dtoText;
    }

    private static generateEnumDeclarations(enums: Enum[], dtoText: string, needComments: boolean): string {
        enums.forEach(currentEnum => {
            if (needComments) {
                dtoText += `/// <summary>\n`;
                dtoText += `/// ${currentEnum.comment ?? currentEnum.name}\n`;
                dtoText += `/// </summary>\n`;
            }

            dtoText += `public enum ${currentEnum.name}\n{\n`;

            currentEnum.values.forEach((value, index) => {
                if (needComments) {
                    dtoText += `    /// <summary>\n`;
                    dtoText += `    /// ${value.comment ?? value.name}\n`;
                    dtoText += `    /// </summary>\n`;
                }

                dtoText += `    ${value.name} = ${value.value}`;
                dtoText += index !== currentEnum.values.length - 1 ? ',\n\n' : '\n';
            });

            dtoText += `}\n\n`;
        });

        return dtoText;
    }

    private static getComment(name: string | null, dtoText: string): string {
        const indent = '    ';
        dtoText += `${indent}/// <summary>\n`;
        dtoText += `${indent}/// ${name}\n`;
        dtoText += `${indent}/// </summary>\n`;
        return dtoText;
    }

    private static getProperty(name: string, isRequired: boolean, isCollection: boolean, isObject: boolean, 
        isEnum: boolean = false, type: Type | null = null) {
        const indent = '    ';
        const objectCollection = (isObject || isEnum) && isCollection ? `ICollection<${name}>` : null;
        const propertyMassive = !isObject && !isEnum && isCollection ? `[]` : "";
        const objectSingular = (isObject || isEnum) && !isCollection ? `${name}` : null;
        const parameterType = !isObject && !isEnum && type ? `${CSharpTypeDict[type!]}` : null;
        const isOptionalField = !isRequired && !isCollection && type !== Type.String ? "?" : "";
        const types = [objectCollection, objectSingular, parameterType].filter(Boolean);

        return `${indent}public ${types}${propertyMassive}${isOptionalField} ${name} { get; set; }\n`;
    }

    private static lineBreak<T>(entities: T[], currentEntity: T, text: string): string {
        const currentEntityIndex = entities.findIndex(p => p === currentEntity);
        if (currentEntityIndex !== entities?.length - 1) {
            text += '\n';
        }
        return text;
    }
}