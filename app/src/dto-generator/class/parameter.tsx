import { Multiplicity } from "./multiplicity";
import { Type } from "./type";

export class Parameter {
    name: string;    
    required: boolean = false;
    multiplicity: Multiplicity;
    type: Type;
    maxLenght: number | null;

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity,
                parameterType: Type,
                maxLenght: number | null) 
    {
        this.name =  name;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.type = parameterType;
        this.maxLenght = maxLenght;
    }
}