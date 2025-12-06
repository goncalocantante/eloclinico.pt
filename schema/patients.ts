import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

export const createClientFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.email(),
  phone: z
    .string()
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  birthdate: z.date(),
});
