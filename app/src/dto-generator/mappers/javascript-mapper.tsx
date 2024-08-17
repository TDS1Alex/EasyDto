import { Class } from "../class/class";
import { Multiplicity } from "../class/multiplicity";

export class JavaScriptMapper {
    public static generateJavaScriptDto(currentClass: Class, dtoText: string) {
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
            if (param.required) {
                dtoText += `${indent}[Required]\n`;
            }

            if (param.required && param.multiplicity === Multiplicity.Collection) {
                dtoText += `${indent}[MinLength(1)]\n`;
            }

            if (param.maxLenght) {
                dtoText += `${indent}[MaxLength(${param.maxLenght})]\n`;
            }

            let propertyText = `${indent}public ${param.type.toLowerCase()} ${param.name} { get; set; }\n`;

            const i = currentClass.parameters.findIndex(p => p === param);
            if (i !== currentClass.parameters?.length - 1 || currentClass.objects) {
                propertyText += '\n';
            }

            dtoText += propertyText;
        });

        return dtoText;
    }

    private static generateObjects(currentClass: Class, dtoText: string): string {
        const indent = '    ';

        currentClass.objects.forEach(object => {
            if (object.required && object.multiplicity === Multiplicity.Collection) {
                dtoText += `${indent}[MinLength(1)]\n`;
            }

            if (object.multiplicity === Multiplicity.Collection) {
                dtoText += `${indent}public ICollection<${object.name}> ${object.name} { get; set; }\n`;
            }

            if (object.multiplicity === Multiplicity.Singular) {
                dtoText += `${indent}public ${object.name} ${object.name} { get; set; }\n`;
            }

            const i = currentClass.objects.findIndex(o => o === object);
            if (i !== currentClass.objects?.length - 1) {
                dtoText += '\n';
            }
        });

        return dtoText;
    }
}