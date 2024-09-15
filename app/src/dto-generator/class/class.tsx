import { CreateClassOrParameterService } from "../services/create-class-or-parameter-service";
import { Enum } from "./enum";
import { Multiplicity } from "./multiplicity";
import { Parameter } from "./parameter";

export class Class {
    name: string;
    required: boolean = false;
    multiplicity: Multiplicity;
    level: number;
    parameters: Parameter[];
    objects: Class[];
    enums: Enum[];

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity,
                level: number) 
    {
        this.name =  name;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.level = level;
        this.parameters = [];
        this.objects = [];
        this.enums = [];
    }

    addParameter(parts: string[]) {
        this.parameters.push(CreateClassOrParameterService.createParameter(parts));
    }

    addEnum(parts: string[]) {
        this.enums.push(CreateClassOrParameterService.createEnum(parts));
    }

    addObject(object: Class) {
        this.objects.push(object);
    }
}