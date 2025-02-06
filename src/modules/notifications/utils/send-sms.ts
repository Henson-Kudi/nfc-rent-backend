import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to: string, body: string) => {
  await client.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
  });
};
