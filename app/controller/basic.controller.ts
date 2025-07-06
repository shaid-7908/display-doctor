//import { UserModel } from "../model/user.model";
import { asyncHandler } from "../utils/async.hadler";
import { Request,Response } from "express";
import { sendError, sendSuccess } from "../utils/unified.response";
import STATUS_CODES from "../utils/status.codes";



class BasicController{
    exampleSuccessControllerFunction = asyncHandler(async (req:Request,res:Response)=>{
        const testSuccessData = {
            test:'Any kind of data can be send'
        }

        return sendSuccess(res,'Test Response',testSuccessData,STATUS_CODES.OK)
    })

    eaxmpleErrorControllerFunction = asyncHandler(async (req:Request,res:Response)=>{
        const testErrorData={
            test:"Any error data can be passed here , if prefre to send if null"
        }

        return sendError(res,'Test Error Response',testErrorData,STATUS_CODES.INTERNAL_SERVER_ERROR)

    })
    exampleMultiFileUploda = asyncHandler(async (req:Request,res:Response)=>{
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        const oneImage = files["one-image"]?.[0];
        const twoImages = files["two-image"] || [];

        if (!oneImage || twoImages.length === 0) {
            return sendError(res,'Required files are missing',null,STATUS_CODES.BAD_REQUEST)
        }

        const uploadedFilesInfo = {
          oneImage: {
            originalName: oneImage.originalname,
            filename: oneImage.filename,
            path: oneImage.path,
            size: oneImage.size,
          },
          twoImages: twoImages.map((file) => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
          })),
        };

        return sendSuccess(res,'Files uploaded successfully!',uploadedFilesInfo,STATUS_CODES.OK)
    })
}

export default new BasicController()