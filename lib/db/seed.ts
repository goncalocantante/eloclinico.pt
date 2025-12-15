async function seed() {
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
