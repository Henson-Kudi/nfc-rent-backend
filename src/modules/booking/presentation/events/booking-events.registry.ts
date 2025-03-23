import { MessageBrokerToken } from "@/common/message-broker";
import { BookingEvents } from "@/common/message-broker/events/booking.event";
import Container from "typedi";
import { handleBookingCancelledEvent } from "./controllers/booking-cancelled.handler";

export class ListenTBookingEvents{
    private static subscriber = Container.get(MessageBrokerToken)

    static listen(){
        Object.entries(this.events).map(([key, value])=> this.subscriber.subscribe(key, value))
    }

    private static events: Record<string, MessageHandler> = {
        [BookingEvents.bookingCancelled] : handleBookingCancelledEvent
    }

}