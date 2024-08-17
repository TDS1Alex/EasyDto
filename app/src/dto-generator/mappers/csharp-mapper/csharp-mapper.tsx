import { Class } from "../../class/class";
import { Multiplicity } from "../../class/multiplicity";
import { Parameter } from "../../class/parameter";
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
        const indent = '    ';

        currentClass.parameters.forEach(param => {
            dtoText = this.generateAttribute(param, dtoText);
            let propertyText = `${indent}public ${CSharpTypeDict[param.type]} ${param.name} { get; set; }\n`;
            propertyText = this.lineBreak(currentClass.parameters, param, propertyText);

            dtoText += propertyText;
        });

        return dtoText;
    }

    private static generateAttribute(param: Parameter, dtoText: string): string {
        const indent = '    ';

        if (param.required && param.type !== Type.Number) {
            dtoText += `${indent}[Required]\n`;
        }

        if (param.required && param.multiplicity === Multiplicity.Collection) {
            dtoText += `${indent}[MinLength(1)]\n`;
        }

        if (param.maxLenght) {
            dtoText += `${indent}[MaxLength(${param.maxLenght})]\n`;
        }
        
        return dtoText;
    }

    private static generateObjects(currentClass: Class, dtoText: string): string {
        const indent = '    ';

        currentClass.objects.forEach(object => {
            dtoText += '\n';

            if (object.required && object.multiplicity === Multiplicity.Collection) {
                dtoText += `${indent}[MinLength(1)]\n`;
            }

            if (object.multiplicity === Multiplicity.Collection) {
                dtoText += `${indent}public ICollection<${object.name}> ${object.name} { get; set; }\n`;
            }

            if (object.multiplicity === Multiplicity.Singular) {
                dtoText += `${indent}public ${object.name} ${object.name} { get; set; }\n`;
            }

            dtoText = this.lineBreak(currentClass.objects, object, dtoText);
        });

        return dtoText;
    }

    private static lineBreak<T>(entities: T[], currentEntity: T, text: string):string {
        const currentEntityIndex = entities.findIndex(p => p === currentEntity);
        if (currentEntityIndex !== entities?.length - 1) {
            text += '\n';
        }
        return text;
    }
}