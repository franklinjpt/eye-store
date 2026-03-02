import { z } from 'zod';
import { isValidExpiry, isValidLuhn } from '@/utils/card-format.utils';

const REQUIRED_FIELD_MESSAGE = 'This field is required';
const INVALID_CARD_NUMBER_MESSAGE = 'Invalid card number';
const INVALID_EXPIRY_MESSAGE = 'Invalid or expired date';
const INVALID_CVV_MESSAGE = 'CVV must be 3-4 digits';
const INVALID_EMAIL_MESSAGE = 'Invalid email';

const nonEmptyTrimmedString = z
  .string()
  .trim()
  .min(1, REQUIRED_FIELD_MESSAGE);

export const creditCardFormSchema = z.object({
  cardNumber: z
    .string()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .transform((value) => value.replace(/\s/g, ''))
    .refine((value) => /^\d+$/.test(value), { message: INVALID_CARD_NUMBER_MESSAGE })
    .refine((value) => isValidLuhn(value), { message: INVALID_CARD_NUMBER_MESSAGE }),
  expiry: z
    .string()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .regex(/^\d{2}\/\d{2}$/, INVALID_EXPIRY_MESSAGE)
    .refine((value) => isValidExpiry(value), { message: INVALID_EXPIRY_MESSAGE }),
  cvv: z
    .string()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .regex(/^\d{3,4}$/, INVALID_CVV_MESSAGE),
  cardholderName: nonEmptyTrimmedString,
});

export const deliveryFormSchema = z.object({
  fullName: nonEmptyTrimmedString,
  email: z
    .string()
    .trim()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .email(INVALID_EMAIL_MESSAGE),
  address: nonEmptyTrimmedString,
  city: nonEmptyTrimmedString,
  phone: nonEmptyTrimmedString,
});

export type CreditCardFormInput = z.input<typeof creditCardFormSchema>;
export type CreditCardFormOutput = z.output<typeof creditCardFormSchema>;
export type DeliveryFormInput = z.input<typeof deliveryFormSchema>;
export type DeliveryFormOutput = z.output<typeof deliveryFormSchema>;
