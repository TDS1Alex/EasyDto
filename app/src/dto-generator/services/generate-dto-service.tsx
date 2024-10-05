import { Class } from "../class/class";
import { Technology } from "../class/technology";
import { CSharpMapper } from "../mappers/csharp/csharp-mapper";
import { GrpcMapper } from "../mappers/grpc/grpc-mapper";
import { JavaScriptMapper } from "../mappers/javascript/javascript-mapper";

export class GenerateDtoService {
    public static generateAllDto(classes: Class[], technology: Technology, needComments: boolean) {
        let dtoText = '';

        switch(technology) {
            case Technology.CSharp:
                classes.forEach(currentClass => {
                    dtoText += CSharpMapper.generateCSharpDto(currentClass, dtoText, needComments);
                });
                break;

            case Technology.JavaScript:
                classes.forEach(currentClass => {
                    dtoText += JavaScriptMapper.generateJavaScriptDto(currentClass, dtoText);
                });
                break;
                
            case Technology.Grpc:
                classes.forEach(currentClass => {
                    dtoText += GrpcMapper.generateGrpcDto(currentClass, dtoText);
                });
                break;

            default:
                classes.forEach(currentClass => {
                    dtoText += CSharpMapper.generateCSharpDto(currentClass, dtoText, needComments);
                });
                break;
        }

        return dtoText;
    }
}