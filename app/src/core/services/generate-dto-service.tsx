import { Class, Enum, Technology } from "../models";
import { CSharpMapper, GrpcMapper, JavaScriptMapper } from "../mappers";

export class GenerateDtoService {
    public static generateAllDto(classes: Class[], technology: Technology, needComments: boolean,
        includeEnumDeclarations: boolean = true) {
        let dtoText = '';

        switch(technology) {
            case Technology.CSharp:
                classes.forEach(currentClass => {
                    dtoText += CSharpMapper.generateCSharpDto(
                        currentClass,
                        dtoText,
                        needComments,
                        includeEnumDeclarations,
                    );
                });
                break;

            case Technology.JavaScript:
                classes.forEach(currentClass => {
                    dtoText += JavaScriptMapper.generateJavaScriptDto(
                        currentClass,
                        dtoText,
                        includeEnumDeclarations,
                    );
                });
                break;
                
            case Technology.Grpc:
                classes.forEach(currentClass => {
                    dtoText += GrpcMapper.generateGrpcDto(
                        currentClass,
                        dtoText,
                        includeEnumDeclarations,
                    );
                });
                break;

            default:
                classes.forEach(currentClass => {
                    dtoText += CSharpMapper.generateCSharpDto(
                        currentClass,
                        dtoText,
                        needComments,
                        includeEnumDeclarations,
                    );
                });
                break;
        }

        return dtoText;
    }

    /*
        Генерация только перечислений — для случая, когда на вход
        подана одна таблица перечисления без описания DTO.
    */
    public static generateAllEnums(enums: Enum[], technology: Technology, needComments: boolean) {
        switch (technology) {
            case Technology.CSharp:
                return CSharpMapper.generateCSharpEnums(enums, needComments);

            case Technology.JavaScript:
                return JavaScriptMapper.generateJavaScriptEnums(enums);

            case Technology.Grpc:
                return GrpcMapper.generateGrpcEnums(enums);

            default:
                return CSharpMapper.generateCSharpEnums(enums, needComments);
        }
    }
}