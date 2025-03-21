import { CreatePaymentDto } from '@/common/dtos';
import {
  SupportedCryptoCurrencies,
  SupportedFiatCurrencies,
} from '@/common/enums';
import Joi from 'joi';

export const CreatePaymentSchema = Joi.object<CreatePaymentDto>({
  bookingId: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string()
    .valid(
      SupportedCryptoCurrencies.ERC20,
      ...Object.values(SupportedCryptoCurrencies),
      ...Object.values(SupportedFiatCurrencies)
    )
    .required(),
  transactionId: Joi.string().optional(),
  paymentMethod: Joi.string().optional(),
  cryptoAddress: Joi.string().optional(),
  paidAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
});
