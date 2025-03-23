import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../base";
import { NotificationType } from "@/modules/notifications/types";
import { User } from "..";

@Entity()
export class Notification extends Base {
    @Column({
        enum: ['SMS', 'EMAIL', 'PUSH'], // Accept values for notification type
        nullable: false
    })
    type!: NotificationType

    @ManyToOne(() => User, user => user.sentNotifications)
    sender!: User

    @ManyToOne(() => User, user => user.notifications)
    receiver!: User

    @Column('jsonb')
    content!: SendEmailNotification | SendPushNotification | SendSMSNotification
}