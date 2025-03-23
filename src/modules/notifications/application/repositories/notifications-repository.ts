import { Notification } from "@/common/entities";
import { Service } from "typedi";
import { Repository } from "typeorm";
@Service()
export class NotificationRepository extends Repository<Notification> { }
