import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { BaseNotificationChannel } from './base-notification.channel';
import nodemailer from 'nodemailer';
import envConf from '@/config/env.conf';

export class EmailNotificationChannel extends BaseNotificationChannel<
    SendEmailNotiication,
    Promise<boolean>
> {
    private readonly mailerService: string = 'Gmail'; // just for testing. Change to a more robust service provider like aws
    private readonly mailConfig = envConf.notification.email;
    private readonly transporter: nodemailer.Transporter<
        SMTPTransport.SentMessageInfo,
        SMTPTransport.Options
    >;

    constructor() {
        super();
        this.transporter = nodemailer.createTransport({
            service: this.mailerService,
            auth: {
                user: this.mailConfig.authUser,
                pass: this.mailConfig.authPass,
            },
        });
    }
    async send(payload: SendEmailNotiication) {
        // Validate payload

        if (!payload.from) {
            payload.from = this.mailConfig.defaultSender;
        }

        await this.transporter.sendMail(payload);

        return true;
    }
}
