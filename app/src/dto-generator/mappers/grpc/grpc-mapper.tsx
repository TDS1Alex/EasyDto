import { Class } from "../../class/class";
import { Multiplicity } from "../../class/multiplicity";
import { Parameter } from "../../class/parameter";
import { Type } from "../../class/type";
import { GrpcRequiredTypeDict } from "./grpc-required-type-dict";
import { GrpcNoRequiredTypeDict } from "./grpc-no-required-type-dict";

export class GrpcMapper {
    public static generateGrpcDto(currentClass: Class, dtoText: string) {
        dtoText = `message ${currentClass.name} {\n`;
        let index: number = 1;

        [dtoText, index] = this.generateParameters(currentClass.parameters, dtoText, index);
        if (currentClass.objects) {
            [dtoText, index] = this.generateObjects(currentClass.objects, dtoText, index);
        }

        dtoText += `}\n\n`;
        return dtoText;
    }

    private static generateParameters(parameters: Parameter[], dtoText: string, index: number): [string, number] {
        parameters.forEach(param => {
            const isCollection = param.multiplicity === Multiplicity.Collection;
            dtoText += this.getProperty(param.name, index, isCollection, false, param.required, param.type);
            dtoText = this.lineBreak(parameters, param, dtoText, false);
            index++
        });       

        return [dtoText, index];
    }

    private static generateObjects(objects: Class[], dtoText: string, index: number): [string, number] {
        dtoText += '\n';
        objects.forEach(object => {
            const isCollection = object.multiplicity === Multiplicity.Collection;
            dtoText += this.getProperty(object.name, index, isCollection, true);
            dtoText = this.lineBreak(objects, object, dtoText, true);
            index++
        });

        return [dtoText, index];
    }

    private static getProperty(name: string, index: number, isCollection: boolean, isObject: boolean, isRequiredType: boolean = false, type: Type | null = null) {
        const indent = '    ';
        const repeated = isCollection ? `repeated ` : '';
        const objectSingular = isObject ? `${name}` : null;
        const parameterType = !isObject && type ? `${isRequiredType ? GrpcRequiredTypeDict[type!] : GrpcNoRequiredTypeDict[type!]}` : null;
        const types = [objectSingular, parameterType].filter(Boolean);

        return`${indent}${repeated}${types} ${name} = ${index};`;
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