import 'dotenv/config';

const config = () => ({
  DATABASE_URL: process.env.DATABASE_URL,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  ZENDESK_API_TOKEN: process.env.ZENDESK_API_TOKEN,
  ZENDESK_DOMAIN: process.env.ZENDESK_DOMAIN,
  ZENDESK_EMAIL: process.env.ZENDESK_EMAIL,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
});

export type Config = ReturnType<typeof config>;

export default config;
