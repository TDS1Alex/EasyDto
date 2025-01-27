import { Multiplicity } from "../enums/multiplicity";

export class Enum {
    name: string;
    translatedName: string;
    required: boolean = false;
    multiplicity: Multiplicity;

    constructor(name: string,
                translatedName: string,
                required: boolean,
                multiplicityType: Multiplicity) 
    {
        this.name =  name;
        this.translatedName = translatedName;
        this.required = required;
        this.multiplicity = multiplicityType;
    }
}