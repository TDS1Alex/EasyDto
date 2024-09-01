import { Type } from "../../class/type";
import { GrpcRequiredType } from "./grpc-required-type";

export const GrpcRequiredTypeDict: {[key in Type]: GrpcRequiredType} = {
    [Type.Number]: GrpcRequiredType.Int,
    [Type.String]: GrpcRequiredType.String,
    [Type.Bool]: GrpcRequiredType.Boolean,
    [Type.DateTime]: GrpcRequiredType.DateTime,
    [Type.Date]: GrpcRequiredType.Date,
    [Type.Guid]: GrpcRequiredType.Guid,
    [Type.Enum]: GrpcRequiredType.Enum,
    [Type.Class]: GrpcRequiredType.Class
}