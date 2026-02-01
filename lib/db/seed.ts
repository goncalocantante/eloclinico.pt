import { db, client } from "./drizzle";
import { 
  users, 
  patients, 
  events, 
  schedules, 
  scheduleAvailability, 
  appointments,
  accounts
} from "./schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth"; // Ensure this path works with tsx setup
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/constants";


const DEMO_USER_NAME = "Utilizador Demo";

async function seed() {
  console.log("🌱 Starting seed process...");

  try {
    // 1. Cleanup existing demo user data
    // Cascading deletes should handle relations, but let's be safe
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, DEMO_USER_EMAIL)
    });

    if (existingUser) {
        console.log(`🗑️ Deleting existing demo user: ${DEMO_USER_EMAIL}`);
        await db.delete(users).where(eq(users.email, DEMO_USER_EMAIL));
    }

    // 2. Create Demo User via Better Auth API to ensure password hashing is correct
    console.log("👤 Creating demo user...");
    
    // We use the auth API to create the user properly with password hashing
    // Note: This requires the server to be runnable in this context, or we mock the request
    // Since we are in a script, 'headers' might need to be mocked if strictly required
    const newUser = await auth.api.signUpEmail({
        body: {
            email: DEMO_USER_EMAIL,
            password: DEMO_USER_PASSWORD,
            name: DEMO_USER_NAME,
        },
        asResponse: false // Returns the data directly
    });
    
    // Wait a moment for async DB ops if any
    
    // Get the user from DB to be sure/get ID
    const demoUser = await db.query.users.findFirst({
        where: eq(users.email, DEMO_USER_EMAIL)
    });

    if (!demoUser) {
        throw new Error("Failed to create demo user");
    }

    // Update email verified and role
    await db.update(users)
        .set({ 
            emailVerified: true,
            role: "owner"
        })
        .where(eq(users.id, demoUser.id));

    console.log(`✅ Demo user created: ${demoUser.id}`);

    // 3. Create Schedule & Availability
    console.log("📅 Creating schedule...");
    const [schedule] = await db.insert(schedules).values({
        userId: demoUser.id,
        timezone: "Europe/Lisbon", 
        // googleCalendarId: "primary" // Optional: simulate google calendar linkage
    }).returning();

    // Add availability (Mon-Fri, 9-18)
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
    const availabilityValues = days.map(day => ({
        scheduleId: schedule.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00"
    }));

    await db.insert(scheduleAvailability).values(availabilityValues);

    // 4. Create Patients
    console.log("👥 Creating patients...");
    const dummyPatients = [
        { name: "Ana Silva", email: "ana.silva@example.com", phone: "+351910000001" },
        { name: "João Santos", email: "joao.santos@example.com", phone: "+351910000002" },
        { name: "Maria Ferreira", email: "maria.ferreira@example.com", phone: "+351910000003" },
        { name: "Pedro Oliveira", email: "pedro.oliveira@example.com", phone: "+351910000004" }
    ];

    const insertedPatients = await db.insert(patients).values(
        dummyPatients.map(p => ({
            userId: demoUser.id,
            ...p
        }))
    ).returning();

    // 5. Create Events (Services)
    console.log("🏷️ Creating services (events)...");
    const dummyEvents = [
        { name: "Consulta Psicologia", durationInMinutes: 60, color: "blue" },
        { name: "Consulta Primeira Vez", durationInMinutes: 90, color: "purple" },
        { name: "Terapia Casal", durationInMinutes: 60, color: "green" }
    ];

    const insertedEvents = await db.insert(events).values(
        dummyEvents.map(e => ({
            userId: demoUser.id,
            name: e.name,
            durationInMinutes: e.durationInMinutes,
            color: e.color as any, // Cast to enum type
            isActive: true
        }))
    ).returning();

    // 6. Create Appointments
    console.log("📌 Creating appointments...");
    const now = new Date();
    // Create some past and future appointments
    const appointmentData = [
        {
            offsetDays: -1, // Yesterday
            hour: 10,
            patientIdx: 0,
            eventIdx: 0
        },
        {
            offsetDays: 0, // Today
            hour: 14,
            patientIdx: 1,
            eventIdx: 0
        },
        {
            offsetDays: 1, // Tomorrow
            hour: 11,
            patientIdx: 2,
            eventIdx: 1
        },
        {
            offsetDays: 2, 
            hour: 16,
            patientIdx: 3,
            eventIdx: 2
        }
    ];

    for (const app of appointmentData) {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + app.offsetDays);
        startDate.setHours(app.hour, 0, 0, 0);

        const event = insertedEvents[app.eventIdx];
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + event.durationInMinutes);

        await db.insert(appointments).values({
            userId: demoUser.id,
            patientId: insertedPatients[app.patientIdx].id,
            scheduleId: schedule.id,
            eventId: event.id,
            title: event.name,
            appointmentType: event.name,
            startDateTime: startDate,
            endDateTime: endDate,
            color: event.color,
            source: "manual",
            notes: "Demo appointment"
        });
    }

    console.log("🎉 Seed completed successfully!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    // Close the connection
    if (client) {
        await client.end();
    }
    process.exit(0);
  }
}

seed();
