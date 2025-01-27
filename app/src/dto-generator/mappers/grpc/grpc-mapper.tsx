import { Class, Multiplicity, Type } from "../../models";
import { GrpcRequiredTypeDict } from "./grpc-required-type-dict";
import { GrpcNoRequiredTypeDict } from "./grpc-no-required-type-dict";

export class GrpcMapper {
    public static generateGrpcDto(currentClass: Class, dtoText: string) {
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
        return dtoText;
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