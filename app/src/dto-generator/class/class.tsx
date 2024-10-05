import { CreateClassOrParameterService } from "../services/create-class-or-parameter-service";
import { Enum } from "./enum";
import { Multiplicity } from "./multiplicity";
import { Parameter } from "./parameter";

export class Class {
    name: string;
    translatedName: string;
    required: boolean = false;
    multiplicity: Multiplicity;
    level: number;
    parameters: Parameter[];
    objects: Class[];
    enums: Enum[];

    constructor(name: string,
                translatedName: string,
                required: boolean,
                multiplicityType: Multiplicity,
                level: number) 
    {
        this.name =  name;
        this.translatedName = translatedName;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.level = level;
        this.parameters = [];
        this.objects = [];
        this.enums = [];
    }

    async addParameter(parts: string[]) {
        this.parameters.push(await CreateClassOrParameterService.createParameter(parts));
    }

    async addEnum(parts: string[]) {
        this.enums.push(await CreateClassOrParameterService.createEnum(parts));
    }

    addObject(object: Class) {
        this.objects.push(object);
    }
}