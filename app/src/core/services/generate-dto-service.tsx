import { Class, Technology } from "../models";
import { CSharpMapper, GrpcMapper, JavaScriptMapper } from "../mappers";

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