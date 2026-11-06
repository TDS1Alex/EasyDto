import { CreateClassOrParameterService } from "../../services/create-class-or-parameter-service";
import { Enum } from "./enum";
import { Multiplicity } from "../enums/multiplicity";
import { Parameter } from "./parameter";
import type { RuleMap } from "../../rules/rule-set";

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

    async addParameter(parts: string[], isNameExist: boolean, rules?: RuleMap) {
        this.parameters.push(await CreateClassOrParameterService.createParameter(parts, isNameExist, rules));
    }

    async addEnum(parts: string[], isNameExist: boolean, rules?: RuleMap) {
        this.enums.push(await CreateClassOrParameterService.createEnum(parts, isNameExist, rules));
    }

    addObject(object: Class) {
        this.objects.push(object);
    }
}