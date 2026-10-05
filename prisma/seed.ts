import { prisma } from "../src/lib/prisma";

// categories and annual budget from spec, just a sample
const sampleBudgets = [
    {name: "Office materials", amount: 600_000},
    {name: "CEO salary", amount: 5_500_000},
    {name: "MIGEC debt", amount: 6_000_000},
];
async function main(){
   const year = await prisma.schoolYear.upsert({
  where: { name: "2026-2027" },
  update: {},
  create: { name: "2026-2027", isActive: true },
   });
  for (const item of sampleBudgets) {
    const category = await prisma.category.upsert({
      where: { name: item.name },
      update: {},
      create: { name: item.name },
    });

    await prisma.budget.upsert({
      where: {
        categoryId_schoolYearId: {
          categoryId: category.id,
          schoolYearId: year.id,
        },
      },
      update: { amount: item.amount },
      create: {
        amount: item.amount,
        categoryId: category.id,
        schoolYearId: year.id,
      },
    });
    console.log(`${item.name}: ${item.amount} FCFA`);
    }
}
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    }).finally(() => prisma.$disconnect());