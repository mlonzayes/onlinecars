import { prisma } from "../src/lib/prisma";

async function main() {
  const dealerships = await prisma.dealership.findMany({
    select: { slug: true, name: true, active: true },
  });
  console.log("Dealerships:", JSON.stringify(dealerships, null, 2));
}

main();
