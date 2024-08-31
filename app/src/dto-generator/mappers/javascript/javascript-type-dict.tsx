import { Type } from "../../class/type";
import { JavaScriptType } from "./javascript-type";

export const JavaScriptTypeDict: {[key in Type]: JavaScriptType} = {
    [Type.Number]: JavaScriptType.Number,
    [Type.String]: JavaScriptType.String,
    [Type.Bool]: JavaScriptType.Boolean,
    [Type.DateTime]: JavaScriptType.DateTime,
    [Type.Date]: JavaScriptType.Date,
    [Type.Guid]: JavaScriptType.Guid,
    [Type.Enum]: JavaScriptType.Enum,
    [Type.Class]: JavaScriptType.Class
}