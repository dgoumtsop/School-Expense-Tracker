import { prisma } from "../src/lib/prisma";
async function main(){
   const year = await prisma.schoolYear.upsert({
  where: { name: "2026-2027" },
  update: {},
  create: { name: "2026-2027", isActive: true },
});
console.log("school year:", year);
}
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    }).finally(() => prisma.$disconnect());