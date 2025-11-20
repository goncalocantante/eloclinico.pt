import { stripe } from "../payments/stripe";
import { db } from "./drizzle";
import {
  users,
  clinics,
  clinicMembers,
  patients,
  Patient,
  accounts,
} from "./schema";
import { hashPassword } from "@/lib/auth/session";
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
  const email = "test@test.com";
  const password = "admin123";
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  await db.transaction(async (tx: any) => {
    console.log("AQUI");

    const [user] = await tx
      .insert(users)
      .values({
        id: userId,
        email,
        name: "Test Owner",
        role: "owner",
      })
      .returning();

    console.log("ALI:", user);
    console.log("userId:", userId);

    await tx.insert(accounts).values({
      id: crypto.randomUUID(),
      userId,
      providerId: "email",
      accountId: email,
      password: passwordHash,
    });
  });

  console.log("Initial user created.");

  const [clinic] = await db
    .insert(clinics)
    .values({
      name: "Test Clinic",
    })
    .returning();

  await db.insert(clinicMembers).values({
    clinicId: clinic.id,
    userId: userId,
    role: "owner",
  });

  await createInitialPatients();

  await createStripeProducts();
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
