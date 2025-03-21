export abstract class BaseNotificationChannel<T, R> {
  abstract send(args: T): R;
}
