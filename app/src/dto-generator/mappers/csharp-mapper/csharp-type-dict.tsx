import { Type } from "../../class/type";
import { CSharpType } from "./csharp-type";

export const CSharpTypeDict: {[key in Type]: CSharpType} = {
    [Type.Number]: CSharpType.Int,
    [Type.String]: CSharpType.String,
    [Type.Bool]: CSharpType.Bool,
    [Type.DateTime]: CSharpType.DateTime,
    [Type.Date]: CSharpType.Date,
    [Type.Guid]: CSharpType.Guid,
    [Type.Enum]: CSharpType.Enum,
    [Type.Class]: CSharpType.Class
}