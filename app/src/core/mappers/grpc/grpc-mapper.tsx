import { Class, Enum, Multiplicity, Type } from "../../models";
import { GrpcRequiredTypeDict } from "./grpc-required-type-dict";
import { GrpcNoRequiredTypeDict } from "./grpc-no-required-type-dict";

export class GrpcMapper {
    public static generateGrpcDto(currentClass: Class, dtoText: string,
        includeEnumDeclarations: boolean = true) {
        const isObjectExist = currentClass.objects && currentClass.objects.length != 0;
        const isEnumExist = currentClass.enums && currentClass.enums.length != 0;

        dtoText = `message ${currentClass.name} {\n`;
        let index: number = 1;

        currentClass.parameters.forEach(param => {
            const isCollection = param.multiplicity === Multiplicity.Collection;
            dtoText += this.getProperty(param.name, index, isCollection, false, param.required, param.type);
            dtoText = this.lineBreak(currentClass.parameters, param, dtoText, !isObjectExist && !isEnumExist);     
            index++
        });

        if (isEnumExist) {
            dtoText += '\n';
            currentClass.enums.forEach(currentEnum => {
                const isCollection = currentEnum.multiplicity === Multiplicity.Collection;
                dtoText += this.getProperty(currentEnum.name, index, isCollection, true);
                dtoText = this.lineBreak(currentClass.enums, currentEnum, dtoText, true);
                index++
            });
        }

        if (isObjectExist) {
            dtoText += '\n';
            currentClass.objects.forEach(object => {
                const isCollection = object.multiplicity === Multiplicity.Collection;
                dtoText += this.getProperty(object.name, index, isCollection, true);
                dtoText = this.lineBreak(currentClass.objects, object, dtoText, true);
                index++
            });
        }

        dtoText += `}\n\n`;

        if (includeEnumDeclarations && isEnumExist) {
            dtoText = this.generateEnumDeclarations(currentClass.enums, dtoText);
        }

        return dtoText;
    }

    /*
        Генерация только перечислений — используется, когда на вход
        подана одна таблица перечисления без описания DTO.
    */
    public static generateGrpcEnums(enums: Enum[]): string {
        return this.generateEnumDeclarations(enums, '');
    }

    private static generateEnumDeclarations(enums: Enum[], dtoText: string): string {
        enums.forEach(currentEnum => {
            const prefix = this.toUpperSnake(currentEnum.name);
            dtoText += `enum ${currentEnum.name} {\n`;

            currentEnum.values.forEach(value => {
                dtoText += `    ${prefix}_${value.name.toUpperCase()} = ${value.value};\n`;
            });

            dtoText += `}\n\n`;
        });

        return dtoText;
    }

    private static toUpperSnake(value: string): string {
        return value
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/[^A-Za-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toUpperCase();
    }

    private static getProperty(name: string, index: number, isCollection: boolean, isObject: boolean,
        isRequiredType: boolean = false, type: Type | null = null) {
        const indent = '    ';
        const repeated = isCollection ? `repeated ` : '';
        const objectSingular = isObject ? `${name}` : null;
        const parameterType = !isObject && type ? `${isRequiredType ? GrpcRequiredTypeDict[type!] : GrpcNoRequiredTypeDict[type!]}` : null;
        const types = [objectSingular, parameterType].filter(Boolean);

        return`${indent}${repeated}${types} ${name} = ${index};`;
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