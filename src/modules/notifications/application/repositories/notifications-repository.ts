export default interface NotificationRepository {
  create(data: any): Promise<any>;
}
