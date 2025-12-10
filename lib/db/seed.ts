import { db } from "./drizzle";
import { users, patients, Patient } from "./schema";
import { faker } from "@faker-js/faker";
import { unique } from "@dpaskhin/unique";

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
