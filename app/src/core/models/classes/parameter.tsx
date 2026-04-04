import { Multiplicity } from "../enums/multiplicity";
import { Type } from "../enums/type";

export class Parameter { 
    name: string;
    required: boolean = false;
    multiplicity: Multiplicity;
    type: Type;
    maxLenght: number | null;
    comment: string | null;

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity,
                parameterType: Type,
                maxLenght: number | null,
                comment: string | null) 
    {
        this.name = name;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.type = parameterType;
        this.maxLenght = maxLenght;
        this.comment =  comment;
    }
}