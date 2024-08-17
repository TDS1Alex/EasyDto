import { Class } from "../class/class";
import { CSharpMapper } from "../mappers/csharp-mapper/csharp-mapper";

export class GenerateDtoService {
    public static generateAllDto(classes: Class[], result: string): string {
        let dtoText = '';

        classes.forEach(curentClass => {
            dtoText += CSharpMapper.generateCSharpDto(curentClass, dtoText);
        });

        result += dtoText;
        return result;
    }
}