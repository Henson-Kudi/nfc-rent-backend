import nodemailer from 'nodemailer';

export const sendEmail = async (params: nodemailer.SendMailOptions) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail(params);

  return true;
};
