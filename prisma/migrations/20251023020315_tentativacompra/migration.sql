-- CreateTable
CREATE TABLE "TentativaCompra" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "pagamento" "Pagamentos" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaCompra_pkey" PRIMARY KEY ("id")
);
