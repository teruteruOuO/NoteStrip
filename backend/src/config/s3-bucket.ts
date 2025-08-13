import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IBucket } from '../../types/types';
dotenv.config();

export class PersonalS3Bucket {
    // Access key of user who's allowed to access and do things with the S3 bucket
    private static readonly userWithS3Access: IBucket = {
        access_key: process.env.AWS_ACCESS_KEY_ID || "none",
        secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || "none",
        aws_region: process.env.AWS_REGION || "none",
        s3_bucket: process.env.S3_BUCKET || 'none'
    }

    // Folder location for all book images
    public static readonly bookImagesLocation: string = process.env.BOOK_IMG_LOCATION || 'none';

    // Make an S3 client with the userWithS3Access's information
    private static readonly s3 = new S3Client({
        region: PersonalS3Bucket.userWithS3Access.aws_region,
        credentials: {
            accessKeyId: PersonalS3Bucket.userWithS3Access.access_key,
            secretAccessKey: PersonalS3Bucket.userWithS3Access.secret_access_key,
        }
    }); 

    // Generate an S3 Upload URL for the image
    public static async generateUploadUrl(fileName: string, contentType: string): Promise<string> {
        let command: PutObjectCommand;
        let signedUrl: string;

        command = new PutObjectCommand({
            Bucket: PersonalS3Bucket.userWithS3Access.s3_bucket,
            Key: `${PersonalS3Bucket.bookImagesLocation}/${fileName}`, // example: booknest/book/images/filename
            ContentType: contentType
        });

        signedUrl = await getSignedUrl(PersonalS3Bucket.s3, command, { expiresIn: 60 * 5 }); // 5 minutes
        return signedUrl;
    }

    // View images through a signed url
    public static async RetrieveImageUrl(imageLocation: string): Promise<string> {
        let command: GetObjectCommand;
        let signedUrl: string;

        command = new GetObjectCommand({
            Bucket: PersonalS3Bucket.userWithS3Access.s3_bucket,
            Key: imageLocation
        });

        signedUrl = await getSignedUrl(PersonalS3Bucket.s3, command, { expiresIn: 60 * 500 });
        return signedUrl;
    }

    // Generate a DELETE pre-signed URL for an object
    public static async generateDeleteUrl(imageLocation: string): Promise<string> {
        let command: DeleteObjectCommand;
        let signedUrl: string;

        command = new DeleteObjectCommand({
            Bucket: PersonalS3Bucket.userWithS3Access.s3_bucket,
            Key: imageLocation
        });

        // Expire in 5 minutes (same window as upload)
        signedUrl = await getSignedUrl(PersonalS3Bucket.s3, command, { expiresIn: 60 * 5 });
        return signedUrl;
    }
}