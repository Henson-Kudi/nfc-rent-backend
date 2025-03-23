export abstract class BaseNotificationChannel<T, R> {
  abstract send(args: T): R;

  abstract validate(data: T): Promise<T>
}
