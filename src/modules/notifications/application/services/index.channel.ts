import { NotificationType } from "../../types";
import { EmailNotificationChannel } from "./email-notification.channel";
import { PushNotificationChannel } from "./push-notification.channel";
import { SMSNotificationChannel } from "./sms-notification.channel";

type ChannelMap = {
    'EMAIL': EmailNotificationChannel;
    'SMS': SMSNotificationChannel;
    'PUSH': PushNotificationChannel;
    // Add other channels here as needed
};

export class NotificationChannelsFactory {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private channels: ChannelMap

    // Register default channels
    constructor() {
        this.channels = {
            'EMAIL': new EmailNotificationChannel(),
            'PUSH': new PushNotificationChannel(),
            'SMS': new SMSNotificationChannel()
        }
    }

    getChannel<T extends NotificationType>(name: T): T extends 'EMAIL' ? EmailNotificationChannel : T extends 'SMS' ? SMSNotificationChannel : PushNotificationChannel {
        const channel = this.channels?.[name]
        if (!channel) {
            throw new Error(`Channel with name "${name}" has not been registered!`)
        }

        return channel as unknown as T extends 'EMAIL' ? EmailNotificationChannel : T extends 'SMS' ? SMSNotificationChannel : PushNotificationChannel
    }
}