import { CreateClassOrParameterService } from "../services/create-class-or-parameter-service";
import { Multiplicity } from "./multiplicity";
import { Parameter } from "./parameter";

export class Class {
    name: string;
    required: boolean = false;
    multiplicity: Multiplicity;
    level: number;
    parameters: Parameter[];
    objects: Class[];

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
    }

    addParameter(parts: string[]) {
        this.parameters.push(CreateClassOrParameterService.createParameter(parts));
    }

    addObject(object: Class) {
        this.objects.push(object);
    }
}