import { CreateClassOrParameterService } from "../../services/create-class-or-parameter-service";
import { Enum } from "./enum";
import { Multiplicity } from "../enums/multiplicity";
import { Parameter } from "./parameter";

export class Class {
    name: string;   
    required: boolean = false;
    multiplicity: Multiplicity;
    level: number;
    comment: string | null;
    parameters: Parameter[];
    objects: Class[];
    enums: Enum[];

    constructor(name: string,
                required: boolean,
                multiplicityType: Multiplicity,
                comment: string | null,
                level: number) 
    {
        this.name = name;
        this.required = required;
        this.multiplicity = multiplicityType;
        this.comment =  comment;
        this.level = level;
        this.parameters = [];
        this.objects = [];
        this.enums = [];
    }

    async addParameter(parts: string[], isNameExist: boolean) {
        this.parameters.push(await CreateClassOrParameterService.createParameter(parts, isNameExist));
    }

    async addEnum(parts: string[], isNameExist: boolean) {
        this.enums.push(await CreateClassOrParameterService.createEnum(parts, isNameExist));
    }

    addObject(object: Class) {
        this.objects.push(object);
    }
}