import "dotenv/config";
type RequiredEnv = {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALPACA_API_KEY: string;
  ALPACA_SECRET_KEY: string;
};

function validateConfig(env: NodeJS.ProcessEnv): RequiredEnv {
  const requiredVars = [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "SENDGRID_API_KEY",
    "SENDGRID_FROM_EMAIL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "ALPACA_API_KEY",
    "ALPACA_SECRET_KEY",
  ];

  const missing = requiredVars.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required env variables: ${missing.join(", ")}`
    );
  }

  return {
    DATABASE_URL: env.DATABASE_URL!,
    REDIS_URL: env.REDIS_URL!,
    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET!,
    SENDGRID_API_KEY: env.SENDGRID_API_KEY!,
    SENDGRID_FROM_EMAIL: env.SENDGRID_FROM_EMAIL!,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET!,
    ALPACA_API_KEY: env.ALPACA_API_KEY!,
    ALPACA_SECRET_KEY: env.ALPACA_SECRET_KEY!,
  };
}

const env = validateConfig(process.env);

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: "15m",
    refreshExpiresIn: "30d",
  },

  sendgrid: {
    apiKey: env.SENDGRID_API_KEY,
    fromEmail: env.SENDGRID_FROM_EMAIL,
  },

  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  alpaca: {
    keyId: env.ALPACA_API_KEY,
    secretKey: env.ALPACA_SECRET_KEY,
    paper: process.env.ALPACA_PAPER !== "false",
  },
};