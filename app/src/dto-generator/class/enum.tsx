import { Multiplicity } from "./multiplicity";

export class Enum {
    name: string;    
    required: boolean = false;
    multiplicity: Multiplicity;

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity) 
    {
        this.name =  name;
        this.required = required;
        this.multiplicity = multiplicityType;
    }
}