import requestHandler from '@/common/request/adapter';
import { NextFunction, Request, Response, Router } from 'express';
import authenticateRequest from '@/common/middleware/authenticate-request';
import GetAccountController from '../http/controller/get-account.controller';
import { hasPermission } from '@/common/middleware/permit-resource';
import { ResourceAction, ResponseCodes } from '@/common/enums';
import { Modules } from '@/common/utils/resourcePathBuilder';
import DeleteAccountController from '../http/controller/delete-account.controller';
import UpdateAccountController from '../http/controller/update-account.controller';
import GetMyBookingsController from '../http/controller/get-my-bookings.controller';
import { AppError } from '@/common/utils';
import Container from 'typedi';
import { BookingService } from '@/modules/booking/application/services/booking.service';
import GetMyBookingController from '../http/controller/get-my-booking.controller';
import CancelMyBookingController from '../http/controller/cancel-my-booking.controller';
import DeleteMyBookingController from '../http/controller/delete-my-booking.controller';

// middleware to validate that a booking belongs to a user
const isUserBooking = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new AppError({
      message: 'Unauthenticated',
      statusCode: ResponseCodes.UnAuthorised
    }))
  }

  const service = Container.get(BookingService)

  if (!await service.isUserBooking(req.user!.id, req.params.id)) {
    next(new AppError({
      statusCode: ResponseCodes.Forbidden,
      message: "Unauthorised"
    }))
  }
  next()
}

const accountRouter = Router();

accountRouter.use(authenticateRequest());

accountRouter
  .route('/')
  .get(
    hasPermission(
      Modules.users.children.user.children.profile.path,
      ResourceAction.READ
    ),
    requestHandler(new GetAccountController())
  )
  .put(
    hasPermission(
      Modules.users.children.user.children.profile.path,
      ResourceAction.UPDATE
    ),
    requestHandler(new UpdateAccountController())
  )
  .delete(
    hasPermission(
      Modules.users.children.user.children.profile.path,
      ResourceAction.DELETE
    ),
    requestHandler(new DeleteAccountController())
  );

// All user bookings should be gotten from here

accountRouter.get('/bookings', requestHandler(new GetMyBookingsController()))
// Manage my bookings (:id -> booking id)
// Validate all bookings belong to this authenticated user
accountRouter.use(isUserBooking)
accountRouter.route('/bookings/:id').get(requestHandler(new GetMyBookingController())).delete(requestHandler(new DeleteMyBookingController())).put(requestHandler(new CancelMyBookingController()))

export default accountRouter;
