/*
  Warnings:

  - You are about to drop the column `vendedorId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `vendedorId` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `vendedorId` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the `vendedores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "logs" DROP CONSTRAINT "logs_vendedorId_fkey";

-- DropForeignKey
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_vendedorId_fkey";

-- DropForeignKey
ALTER TABLE "vendas" DROP CONSTRAINT "vendas_vendedorId_fkey";

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "vendedorId";

-- AlterTable
ALTER TABLE "produtos" DROP COLUMN "vendedorId";

-- AlterTable
ALTER TABLE "vendas" DROP COLUMN "vendedorId";

-- DropTable
DROP TABLE "vendedores";
