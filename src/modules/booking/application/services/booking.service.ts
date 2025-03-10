import { Inject, Service } from "typedi";
import { LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";
import { PricingService } from "./pricing.service";
import { PaymentService } from "./payment.service";
import { AppError } from "@/common/utils";
import { BookingStatus, PaymentStatus, ResponseCodes } from "@/common/enums";
import { CarRepository } from "@/modules/cars/infrastrucure/car.repository";
import { BookingRepository } from "../repository/booking.repository";
import { SerializerService } from "@/common/services/serializer.service";
import { BookingDto, PaymentDto } from "@/common/dtos";
import { CreateBookingDto } from "@/common/dtos/booking.dto";
import { validateBookingSchema } from "../../utils/validation/booking.validation";
import { Driver, User } from "@/common/entities";
import { UserRepository } from "@/modules/auth/infrastructure/repositories/user.repository";
import { DriverRepository } from "@/modules/auth/infrastructure/repositories/driver.repository";

@Service()
export class BookingService {
    constructor(
        @Inject()
        private bookingRepository: BookingRepository,
        @Inject()
        private carRepository: CarRepository,
        @Inject()
        private userRepository: UserRepository,
        @Inject()
        private driverRepository: DriverRepository,
        @Inject()
        private pricingService: PricingService,
        @Inject()
        private paymentService: PaymentService,
        @Inject()
        private readonly serializer: SerializerService
    ) { }

    async createBooking(dto: CreateBookingDto, actor: User) {

        const valid = await validateBookingSchema(dto)

        // Esure car exists
        const car = await this.carRepository.getCar(valid.carId, {
            withAddons: true
        });

        if (!car) throw new AppError({ message: 'Car not found', statusCode: ResponseCodes.NotFound });

        // Ensure user is valid
        const foundUser = await this.userRepository.findOne({
            where: { id: valid.userId },
            relations: ['drivers']
        })

        if (!foundUser) {
            throw new AppError({
                message: 'User with identifier does not exist',
                statusCode: ResponseCodes.BadRequest
            })
        }


        let driver: Driver | null = null

        // Ensure driver is valid
        if (typeof valid.driver === 'string') {
            driver = foundUser.drivers?.find(driver => driver.id === valid.driver) || null
        } else {
            driver = this.driverRepository.create(valid.driver)
        }

        if (!driver) {
            throw new AppError({
                message: "Invalid driver details",
                statusCode: ResponseCodes.BadRequest
            })
        }

        // Availability check
        const isAvailable = await this.isCarAvailable(car.id, new Date(valid.pickupDate), new Date());

        if (!isAvailable) throw new AppError({
            message: 'Car not available',
            statusCode: ResponseCodes.BadRequest
        });

        // save driver details
        driver = await this.driverRepository.save(driver)

        // Price calculation
        const { total, breakdown } = await this.pricingService.calculateTotalPrice(
            car,
            new Date(valid.pickupDate),
            new Date(valid.returnDate),
            [],
            // valid.selectedAddons,
            valid.paymentData.currency
        );

        // Create booking
        const booking = await this.bookingRepository.save(this.bookingRepository.create({
            user: foundUser,
            car: car,
            driver,
            pickupDate: valid.pickupDate,
            returnDate: valid.returnDate,
            totalAmount: total,
            // selectedAddons: valid.selectedAddons,
            priceBreakdown: breakdown,
        }));

        // Process payment
        const paymentResult = await this.paymentService.createPayment({
            ...valid.paymentData,
            bookingId: booking.id,
            amount: total,
        }, booking); // this should return payment data and a payment intent

        return { booking: this.serializer.serialize(BookingDto, booking, dto?.locale || 'en'), payment: this.serializer.serialize(PaymentDto, paymentResult, dto?.locale || 'en') };
    }

    async isCarAvailable(carId: string, startDate: Date, endDate: Date): Promise<boolean> {
        const conflictingBookings = await this.bookingRepository.count({
            where: {
                car: { id: carId },
                status: Not(BookingStatus.CANCELLED),
                pickupDate: LessThanOrEqual(endDate),
                returnDate: MoreThanOrEqual(startDate),
            }
        });

        return conflictingBookings === 0;
    }

    async cancelBooking(bookingId: string, reason?: string) {
        const booking = await this.bookingRepository.findOneBy({ id: bookingId });

        if (!booking) {
            throw new AppError({
                message: 'Booking not found',
                statusCode: ResponseCodes.NotFound
            });
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new AppError({
                message: 'Cannot cancel booking in current status ' + booking.status,
                statusCode: ResponseCodes.BadRequest
            });
        }

        booking.status = BookingStatus.CANCELLED;
        booking.cancellationReason = reason;
        await this.bookingRepository.save(booking);

        // Initiate refund if payment was made
        if (booking.payment?.status === PaymentStatus.PAID) {
            await this.paymentService.processRefund(booking.payment.transactionId!);
        }

        return booking;
    }

    async getCarBookings(carId: string) {
        return this.bookingRepository.find({
            where: { car: { id: carId } },
            relations: ['user', 'payment'],
        });
    }
}