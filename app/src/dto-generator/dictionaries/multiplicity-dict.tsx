import { Multiplicity } from "../class/multiplicity";

export const MultiplicityDict: { [key: string]: Multiplicity } = {
    "1": Multiplicity.Singular,
    "0..1": Multiplicity.Singular,
    "0..*": Multiplicity.Collection,
    "1..*": Multiplicity.Collection
};