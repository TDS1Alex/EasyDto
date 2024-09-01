import { Class } from "../class/class";
import { Technology } from "../class/technology";
import { CSharpMapper } from "../mappers/csharp/csharp-mapper";
import { GrpcMapper } from "../mappers/grpc/grpc-mapper";
import { JavaScriptMapper } from "../mappers/javascript/javascript-mapper";

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
                classes.forEach(curentClass => {
                    dtoText += JavaScriptMapper.generateJavaScriptDto(curentClass, dtoText);
                });
                break;
                
            case Technology.Grpc:
                classes.forEach(curentClass => {
                    dtoText += GrpcMapper.generateGrpcDto(curentClass, dtoText);
                });
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