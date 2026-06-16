import prisma from "../db.server";

export async function getActiveBlock(shop: string, type: string) {
  return prisma.thankYouBlock.findFirst({
    where: {shop, type, status: "active"},
    orderBy: {updatedAt: "desc"},
  });
}