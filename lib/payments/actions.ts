"use server";

import { redirect } from "next/navigation";
import { createCheckoutSession, createCustomerPortalSession } from "./stripe";
import { withClinic } from "@/lib/auth/middleware";

export const checkoutAction = withClinic(async (formData, clinic) => {
  const priceId = formData.get("priceId") as string;
  await createCheckoutSession({ clinic: clinic, priceId });
});

export const customerPortalAction = withClinic(async (_, clinic) => {
  const portalSession = await createCustomerPortalSession(clinic);
  redirect(portalSession.url);
});
