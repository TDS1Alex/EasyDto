import { Type } from "../class/type";

export const TypeDict: { [key: string]: Type } = {
    "число": Type.Number,
    "строка": Type.String,
    "логический": Type.Bool,
    "дата и время": Type.DateTime,
    "дата": Type.Date,
    "время": Type.Date,
    "guid": Type.Guid,
    "перечисление": Type.Enum,
    "объект": Type.Class
};