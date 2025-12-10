import { stripe } from "../payments/stripe";
import { db } from "./drizzle";
import { users, patients, Patient } from "./schema";
import { faker } from "@faker-js/faker";
import { unique } from "@dpaskhin/unique";

async function createStripeProducts() {
  console.log("Creating Stripe products and prices...");

  const baseProduct = await stripe.products.create({
    name: "Base",
    description: "Base subscription plan",
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: "Plus",
    description: "Plus subscription plan",
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  console.log("Stripe products and prices created successfully.");
}

async function createInitialPatients() {
  // Create 100 clients using realistic mock data from faker
  const patientsMock: Patient[] = Array.from({ length: 100 }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: unique(faker.internet.email()),
    phone: faker.phone.number({ style: "international" }),
    position: faker.person.jobTitle(),
    address: faker.location.streetAddress(),
    //  profileImage: faker.image.avatar(),
    information: faker.lorem.paragraphs(),
    dateOfBirth: faker.date.past({ years: 10 }),
  }));

  await db.insert(patients).values(patientsMock).returning();

  console.log("Initial patients created.");
}

async function seed() {
  await createInitialPatients();
  await createStripeProducts();
  console.log(
    "Seed completed. Note: Users are created via Google OAuth sign-in."
  );
}

seed()
  .catch((error) => {
    console.error("Seed process failed:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seed process finished. Exiting...");
    process.exit(0);
  });
