declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT?: string;
      DATABASE_URL?: string;
      JWT_SECRET?: string;
      REFRESH_TOKEN_SECRET?: string;
      REDIS_URL?: string;
      AWS_S3_BUCKET?: string;
      AWS_REGION?: string;
      WHATSAPP_API_TOKEN?: string;
      WHATSAPP_PHONE_NUMBER_ID?: string;
    }
  }
}

export {};
