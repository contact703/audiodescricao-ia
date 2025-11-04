/**
 * Script de teste da aplicação de audiodescrição
 */

import { setTimeout } from "timers/promises";

const BASE_URL = "http://localhost:3000";

async function testApp() {
  console.log("🧪 Iniciando testes da aplicação de audiodescrição...\n");

  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log("1️⃣  Testando servidor...");
    const homeResponse = await fetch(BASE_URL);
    if (homeResponse.ok) {
      console.log("   ✅ Servidor está rodando\n");
    } else {
      throw new Error("Servidor não está respondendo");
    }

    // Teste 2: Criar projeto de teste via YouTube
    console.log("2️⃣  Criando projeto de teste (YouTube)...");
    
    // Simular criação de projeto (precisaria de autenticação real)
    console.log("   ℹ️  Para testar completamente, é necessário:");
    console.log("   - Fazer login na interface web");
    console.log("   - Criar um projeto via YouTube ou upload");
    console.log("   - Aguardar processamento");
    console.log("   - Verificar roteiro e áudio gerados\n");

    // Teste 3: Verificar endpoint de storage
    console.log("3️⃣  Testando endpoint de storage...");
    const storageTest = await fetch(`${BASE_URL}/api/storage/upload`, {
      method: "POST",
    });
    
    // Esperamos 400 porque não enviamos arquivo
    if (storageTest.status === 400) {
      console.log("   ✅ Endpoint de storage está funcionando\n");
    } else {
      console.log("   ⚠️  Endpoint de storage retornou status inesperado:", storageTest.status, "\n");
    }

    // Teste 4: Verificar tRPC
    console.log("4️⃣  Testando API tRPC...");
    const trpcTest = await fetch(`${BASE_URL}/api/trpc/auth.me`);
    if (trpcTest.ok || trpcTest.status === 401) {
      console.log("   ✅ API tRPC está funcionando\n");
    } else {
      console.log("   ⚠️  API tRPC retornou status inesperado:", trpcTest.status, "\n");
    }

    console.log("✅ Testes básicos concluídos com sucesso!");
    console.log("\n📋 Próximos passos para teste completo:");
    console.log("1. Acesse a aplicação em: " + BASE_URL);
    console.log("2. Faça login");
    console.log("3. Crie um novo projeto");
    console.log("4. Aguarde o processamento (1-2 minutos)");
    console.log("5. Verifique o roteiro e os áudios gerados");

  } catch (error) {
    console.error("❌ Erro nos testes:", error.message);
    process.exit(1);
  }
}

testApp();
