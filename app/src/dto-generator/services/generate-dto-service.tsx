import { Class } from "../class/class";
import { Technology } from "../class/technology";
import { CSharpMapper } from "../mappers/csharp-mapper/csharp-mapper";

export class GenerateDtoService {
    public static generateAllDto(classes: Class[], technology: Technology): string {
        let dtoText = '';

        switch(technology) {
            case Technology.CSharp:
                classes.forEach(curentClass => {
                    dtoText += CSharpMapper.generateCSharpDto(curentClass, dtoText);
                });
                break;

            case Technology.JavaScript:
                break;
                
            case Technology.Grpc:
                break;
                
            default:
                classes.forEach(curentClass => {
                    dtoText += CSharpMapper.generateCSharpDto(curentClass, dtoText);
                });
                break;
        }

        return dtoText;
    }
}