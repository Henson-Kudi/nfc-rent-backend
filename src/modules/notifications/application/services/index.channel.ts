import { NotificationType } from "../../types";
import { BaseNotificationChannel } from "./base-notification.channel";
import { EmailNotificationChannel } from "./email-notification.channel";
import { PushNotificationChannel } from "./push-notification.channel";
import { SMSNotificationChannel } from "./sms-notification.channel";

export class NotificationChannelsFactory {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private channels: Map<NotificationType, BaseNotificationChannel<any, any>> = new Map()

    // Register default channels
    constructor() {
        this.registerChannel('EMAIL', new EmailNotificationChannel())
        this.registerChannel('PUSH', new PushNotificationChannel())
        this.registerChannel('SMS', new SMSNotificationChannel())
    }

    getChannel(name: NotificationType) {
        if (!this.channels.get(name)) {
            throw new Error(`Channel with name "${name}" has not been registered!`)
        }

        this.channels.get(name)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerChannel(channel: NotificationType, channelHandler: BaseNotificationChannel<any, any>) {
        this.channels.set(channel, channelHandler)
    }
}