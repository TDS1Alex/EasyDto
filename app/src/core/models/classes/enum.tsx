import { Multiplicity } from "../enums/multiplicity";
import { EnumValue } from "./enum-value";

export class Enum {  
    name: string;
    required: boolean = false;
    multiplicity: Multiplicity;
    comment: string | null;
    values: EnumValue[];

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity,
                comment: string | null,
                values: EnumValue[] = []) 
    {
        this.name = name;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.comment =  comment;
        this.values = EnumValue.normalize(values);
    }
}
