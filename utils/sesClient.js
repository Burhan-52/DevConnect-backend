import { SESClient } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.AWS_REGION;

const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_EMAIL_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_EMAIL_SECRET_KEY_ID,
  },
});

export { sesClient };
