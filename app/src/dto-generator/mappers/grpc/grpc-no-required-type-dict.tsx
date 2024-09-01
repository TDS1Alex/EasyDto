import { Type } from "../../class/type";
import { GrpcNoRequiredType } from "./grpc-no-required-type";

export const GrpcNoRequiredTypeDict: {[key in Type]: GrpcNoRequiredType} = {
    [Type.Number]: GrpcNoRequiredType.Int,
    [Type.String]: GrpcNoRequiredType.String,
    [Type.Bool]: GrpcNoRequiredType.Boolean,
    [Type.DateTime]: GrpcNoRequiredType.DateTime,
    [Type.Date]: GrpcNoRequiredType.Date,
    [Type.Guid]: GrpcNoRequiredType.Guid,
    [Type.Enum]: GrpcNoRequiredType.Enum,
    [Type.Class]: GrpcNoRequiredType.Class
}