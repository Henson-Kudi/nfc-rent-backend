import { Inject, Service } from 'typedi';
import { PaymentService } from './payment.service';
import {
  AppError,
  IReturnValue,
  IReturnValueWithPagination,
} from '@/common/utils';
import { BookingStatus, PaymentStatus, ResponseCodes } from '@/common/enums';
import {
  CarRepository,
  CarsRepositoryToken,
} from '@/modules/cars/infrastrucure/car.repository';
import { SerializerService } from '@/common/services/serializer.service';
import { BookingDto, PaymentDto } from '@/common/dtos';
import { CreateBookingDto } from '@/common/dtos/booking.dto';
import { validateBookingSchema } from '../../utils/validation/booking.validation';
import { Driver, User } from '@/common/entities';
import { UserRepository } from '@/modules/auth/infrastructure/repositories/user.repository';
import { DriverRepository } from '@/modules/auth/infrastructure/repositories/driver.repository';
import { MessageBrokerToken } from '@/common/message-broker';
import { BookingEvents } from '@/common/message-broker/events/booking.event';
import logger from '@/common/utils/logger';
import {
  BookingRepository,
  BookingsRepositoryToken,
} from '../../infrastructure/booking.repository';
import { PricingService } from './pricing.service';
import { CreateContractDto } from '@/common/dtos/contract.dto';
import { ContractService } from './contract.service';

@Service()
export class BookingService {
  constructor(
    @Inject(BookingsRepositoryToken)
    private bookingRepository: BookingRepository,
    @Inject(CarsRepositoryToken)
    private carRepository: CarRepository,
    @Inject()
    private userRepository: UserRepository,
    @Inject()
    private driverRepository: DriverRepository,
    @Inject()
    private paymentService: PaymentService,
    @Inject()
    private readonly serializer: SerializerService,
    @Inject(MessageBrokerToken)
    private readonly messageBroker: IMessageBroker,
    @Inject()
    private readonly pricingService: PricingService,
    @Inject()
    private readonly contractService: ContractService
  ) { }

  async createBooking(dto: CreateBookingDto, actor: User) {
    const valid = await validateBookingSchema(dto);

    // Ensure pricing data is valid
    const decodedPrice = this.pricingService.verifyPrice(valid.pricing);

    // Esure car exists
    const car = await this.carRepository.getCar(valid.carId, {
      withAddons: true,
    });

    if (!car)
      throw new AppError({
        message: 'Car not found',
        statusCode: ResponseCodes.NotFound,
      });

    // Ensure user is valid
    const foundUser = await this.userRepository.findOne({
      where: { id: valid.userId },
      relations: ['drivers'],
    });

    if (!foundUser) {
      throw new AppError({
        message: 'User with identifier does not exist',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    let driver: Driver | null = null;

    // Ensure driver is valid
    if (typeof valid.driver === 'string') {
      driver =
        foundUser.drivers?.find((driver) => driver.id === valid.driver) || null;
    } else {
      driver = this.driverRepository.create(valid.driver);
    }

    if (!driver) {
      throw new AppError({
        message: 'Invalid driver details',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // Availability check
    const isAvailable = await this.isCarAvailable(
      car.id,
      new Date(valid.pickupDate),
      new Date()
    );

    if (!isAvailable)
      throw new AppError({
        message: 'Car not available',
        statusCode: ResponseCodes.BadRequest,
      });

    // save driver details
    driver = await this.driverRepository.save(driver);
    // Create booking
    const booking = await this.bookingRepository.save(
      this.bookingRepository.create({
        user: foundUser,
        car: car,
        driver,
        pickupDate: valid.pickupDate,
        returnDate: valid.returnDate,
        totalAmount: decodedPrice.total,
        securityDeposit: decodedPrice?.breakdown.securityDeposit,
        // selectedAddons: valid.selectedAddons,
        priceBreakdown: decodedPrice.breakdown,
      })
    );

    // Process payment
    const paymentResult = await this.paymentService.createPayment(
      booking,
      decodedPrice.currency
    ); // this should return payment data and a payment intent

    // Emit event of booking created
    try {
      this.messageBroker.publishMessage(BookingEvents.bookingCreated, {
        data: { actor, booking },
      });
    } catch (error) {
      logger.error(
        `Failed to publish event: ${BookingEvents.bookingCreated}`,
        error
      );
    }

    return new IReturnValue({
      message: 'Booking created successfully',
      success: true,
      data: {
        ...paymentResult,
        booking: this.serializer.serialize(
          BookingDto,
          booking,
          dto?.locale || 'en'
        ),
        payment: this.serializer.serialize(
          PaymentDto,
          paymentResult.payment,
          dto?.locale || 'en'
        ),
      },
    });
  }

  isCarAvailable(_: string, __: Date, ___: Date) {
    // const conflictingBookings = await this.bookingRepository.count({
    //     where: {
    //         car: { id: carId },
    //         status: Not(BookingStatus.CANCELLED),
    //         pickupDate: LessThanOrEqual(endDate),
    //         returnDate: MoreThanOrEqual(startDate),
    //     }
    // });

    // return conflictingBookings === 0;
    return true;
  }

  async cancelBooking(payload: {
    bookingId: string;
    reason?: string;
    locale?: SupportedLocales;
    actor: User;
  }) {
    const { actor, bookingId, locale, reason } = payload;

    let booking = await this.bookingRepository.findOneBy({ id: bookingId });

    if (!booking) {
      throw new AppError({
        message: 'Booking not found',
        statusCode: ResponseCodes.NotFound,
      });
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError({
        message: 'Cannot cancel booking in current status ' + booking.status,
        statusCode: ResponseCodes.BadRequest,
      });
    }

    booking = await this.bookingRepository.save(this.bookingRepository.merge(booking, { status: BookingStatus.CANCELLED, cancellationReason: reason }));

    // Initiate refund if payment was made
    if (booking.payment?.status === PaymentStatus.PAID) {
      await this.paymentService.processRefund(booking.payment.transactionId!);
    } else if (booking.payment?.status === PaymentStatus.PENDING_CAPTURE) {
      await this.paymentService.cancelPayment(booking.payment.transactionId!);
    }

    try {
      this.messageBroker.publishMessage(BookingEvents.bookingCancelled, {
        data: { actor, booking },
      });
    } catch (error) {
      logger.error(
        `Failed to publish ${BookingEvents.bookingCancelled} event`,
        error
      );
    }

    return new IReturnValue({
      data: this.serializer.serialize(BookingDto, booking, locale || 'en'),
      success: true,
      message: 'Booking cancelled successfully',
    });
  }

  async deleteBooking(bookingId: string, actor: User) {
    const { data } = await this.getBooking(bookingId)
    if (!data) {
      throw new AppError({
        message: "Booking not found",
        statusCode: ResponseCodes.NotFound
      })
    }

    // Booking cannot be deleted in PENDING or ACTIVE status
    if ([BookingStatus.ACTIVE, BookingStatus.PENDING].includes(data.status)) {
      throw new AppError({
        message: `Booking cannot be deleted in current state: ${data.status}`,
        statusCode: ResponseCodes.BadRequest
      })
    }

    // Soft delete booking, then schedule a job to remove all relations of booking then hard delete booking after all relations have been removed in order to avoid foreign key constraint errors
    await this.bookingRepository.softDelete(data.id)

    this.messageBroker.publishMessage(BookingEvents.bookingDeleted, { data: { booking: data, actor } })

    return new IReturnValue({ success: true, data, message: "Booking deleted successfully" })


  }

  async confirmBooking(
    bookingId: string,
    actor: User,
    options?: {
      locale?: SupportedLocales;
      contractData?: CreateContractDto;
    }
  ) {
    const { locale } = options || {};
    // Ensur booking exists and is in pending state
    const foundBooking = await this.bookingRepository.findOne({
      where: {
        id: bookingId,
      },
      relations: {
        payment: {
          addressMap: true,
        },
      },
    });

    if (!foundBooking) {
      throw new AppError({
        statusCode: ResponseCodes.NotFound,
        message: 'Could not find booking with provided identifier',
      });
    }

    if (foundBooking.status !== BookingStatus.PENDING) {
      throw new AppError({
        message: `Cannot confirm booking with status: ${foundBooking.status}`,
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // Capture payment (for fiat payments) and update booking status
    if (!foundBooking.payment.isCrypto) {
      if (!foundBooking.payment.transactionId) {
        throw new AppError({
          message: `Failed to capture payment for booking. Please try again later`,
          statusCode: ResponseCodes.BadRequest,
        });
      }
      await this.paymentService.confirmPayment(
        foundBooking.payment.transactionId
      );
    } else {
      // Ensure client has paid at least 90% of total booking fee
      const totalAmount = foundBooking.totalAmount;
      const totalPayments = foundBooking.payment.addressMap.deposits
        .map((itm) => parseFloat(itm.amount))
        .reduce((acc, val): number => acc + val, 0);
      const paidRate = totalPayments / totalAmount;

      if (paidRate < 0.9) {
        throw new AppError({
          message: `Client has paid only ${(paidRate * 100).toFixed(2)} of total booking amount. Do you want to force capture this amount?`,
          statusCode: ResponseCodes.BadRequest,
        });
      }
      // if 90% is captured, nothing to be done
    }

    const updated = await this.bookingRepository.save(this.bookingRepository.merge(foundBooking, {
      status: BookingStatus.CONFIRMED,
      plateNumber: options?.contractData?.carPlateNumber
    }));

    // validate contract data if provided
    if (options?.contractData) {
      try {
        const contract = await this.contractService.createContract(
          {
            ...options?.contractData,
            bookingId: updated.id,
          },
          actor
        );

        // save contract data to booking
        updated.contract = contract.data;
      } catch (error) {
        logger.error(
          `Failed to create contract for booking ${updated.id}`,
          error
        );
      }
    }

    // Publish booking confirmed event
    try {
      this.messageBroker.publishMessage(BookingEvents.bookingConfirmed, {
        data: { actor, booking: updated },
      });
    } catch (error) {
      logger.info(
        `Failed to publish ${BookingEvents.bookingConfirmed} event.`,
        error
      );
    }

    return new IReturnValue({
      data: this.serializer.serialize(BookingDto, updated, locale),
      message: 'Booking confirmed',
      success: true,
    });
  }

  async getCarBookings(carId: string, options: GetBookingOptions) {
    const parsedPage = parseInt(options?.page?.toString() || '1');
    const parsedLimit = parseInt(options?.limit?.toString() || '10');

    const page =
      isNaN(parsedPage) || parsedPage < 1 || parsedPage > 100 ? 1 : parsedPage;
    const limit =
      isNaN(parsedLimit) || parsedLimit < 0
        ? 10
        : parsedLimit >= 100
          ? 100
          : parsedLimit;
    const skip = (page - 1) * limit;

    const [data, total] = await this.bookingRepository.getCarBookings(carId, {
      ...(options || {}),
      limit,
      skip,
    });

    const serialisedData = this.serializer.serialize(
      BookingDto,
      data,
      options?.locale || 'en'
    );

    return new IReturnValueWithPagination({
      success: true,
      message: 'Car bookings fetched',
      data: serialisedData as unknown as BookingDto[],
      limit,
      page,
      total,
    });
  }

  async getBooking(id: string, locale?: SupportedLocales) {
    const data = await this.bookingRepository.getBooking(id, { locale });

    const serialisedData = this.serializer.serialize(
      BookingDto,
      data,
      locale || 'en'
    );

    return new IReturnValue({
      success: true,
      message: 'Booking fetched',
      data: serialisedData,
    });
  }

  async getUserBookings(userId: string, options: GetBookingOptions) {
    const parsedPage = parseInt(options?.page?.toString() || '1');
    const parsedLimit = parseInt(options?.limit?.toString() || '10');

    const page =
      isNaN(parsedPage) || parsedPage < 1 || parsedPage > 100 ? 1 : parsedPage;
    const limit =
      isNaN(parsedLimit) || parsedLimit < 0
        ? 10
        : parsedLimit >= 100
          ? 100
          : parsedLimit;
    const skip = (page - 1) * limit;

    const [data, total] = await this.bookingRepository.getUserBookings(userId, {
      ...(options || {}),
      limit,
      skip,
    });

    const serialisedData = this.serializer.serialize(
      BookingDto,
      data,
      options?.locale || 'en'
    );

    return new IReturnValueWithPagination({
      success: true,
      message: 'User bookings fetched',
      data: serialisedData as unknown as BookingDto[],
      limit,
      page,
      total,
    });
  }

  async listBookings(query: GetBookingsQuery) {
    const {
      page: Page,
      limit: Limit,
      relations,
      ...rest
    } = query || ({} as GetBookingsQuery);

    const parsedPage = parseInt(Page?.toString() || '1');
    const parsedLimit = parseInt(Limit?.toString() || '10');

    const page =
      isNaN(parsedPage) || parsedPage < 1 || parsedPage > 100 ? 1 : parsedPage;

    const limit =
      isNaN(parsedLimit) || parsedLimit < 0
        ? 10
        : parsedLimit >= 100
          ? 100
          : parsedLimit;

    const skip = (page - 1) * limit;

    const [data, total] = await this.bookingRepository.getBookings(rest, {
      locale: query?.locale,
      relations,
      limit,
      skip,
    });

    const serialisedData = this.serializer.serialize(
      BookingDto,
      data,
      query?.locale || 'en'
    );

    return new IReturnValueWithPagination({
      success: true,
      message: 'Bookings fetched',
      data: serialisedData as unknown as BookingDto[],
      limit,
      page,
      total,
    });
  }

  async isUserBooking(userId: string, bookingId: string) {
    const count = await this.bookingRepository.count({ where: { id: bookingId, user: { id: userId } }, relations: ['user'] })

    return count > 0
  }
}
