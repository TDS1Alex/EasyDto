import { Multiplicity } from "../enums/multiplicity";

export class Enum {  
    name: string;
    required: boolean = false;
    multiplicity: Multiplicity;
    comment: string | null;

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity,
                comment: string | null) 
    {
        this.name = name;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.comment =  comment;
    }
}