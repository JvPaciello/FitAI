require("dotenv").config();
const venom = require("venom-bot");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cron = require("node-cron");

// 🔹 Importação dos modelos do MongoDB
const User = require("./models/User");
const Message = require("./models/Message");

// 🔹 Configuração do Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Conectar ao MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado ao MongoDB Local"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

// 🔹 Função para buscar dados do MongoDB e sincronizar com Gemini
async function buscarDadosMongoDB() {
  try {
    return await User.find();
  } catch (error) {
    console.error("❌ Erro ao buscar dados do MongoDB:", error);
    return [];
  }
}

// 🔹 Atualizar Gemini com os dados do MongoDB
async function atualizarGemini(dados) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Atualize os planos de treino e dieta com base nos seguintes dados:\n\n${JSON.stringify(dados)}` }]
        }
      ]
    });

    const respostaGemini = response?.candidates?.[0]?.content?.parts?.[0]?.text || ".";
    console.log("✅ Gemini atualizado com sucesso!", respostaGemini);
  } catch (error) {
    console.error("❌ Erro ao atualizar o Gemini:", error);
  }
}


// 🔹 Função para sincronizar os dados a cada 2 minutos
cron.schedule("*/2 * * * *", async () => {
  console.log("🔄 Sincronizando dados com Gemini...");
  const dados = await buscarDadosMongoDB();
  await atualizarGemini(dados);
});
console.log("⏳ Agendamento de sincronização de dados ativo...");

// 🔹 Inicializar o WhatsApp Bot com Venom

venom
  .create({ session: "FitAI-Session", multidevice: true, headless: "new" })
  .then((client) => start(client))
  .catch((error) => console.log("❌ Erro ao iniciar o bot:", error));

// 🔹 Função principal do bot
async function start(client) {
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      console.log(`📩 Mensagem recebida de ${message.from}: ${message.body}`);

      try {
        let user = await User.findOne({ phoneNumber: message.from });

        // 🔹 Se o usuário não existir, criar um novo usuário
        if (!user) {
          console.log("🆕 Novo usuário detectado, criando perfil...");
          user = new User({ phoneNumber: message.from });
          await user.save();
          client.sendText(message.from, "Olá! 👋 Para personalizar seu acompanhamento, qual é o seu nome?");
          return;
        }

        // 🔹 Fluxo de cadastro do usuário
        if (!user.name) {
          user.name = message.body.trim();
          await user.save();
          client.sendText(message.from, `Obrigado, ${user.name}! Agora me diga sua idade.`);
          return;
        }

        if (!user.age) {
          if (isNaN(message.body.trim())) {
            client.sendText(message.from, "❌ Informe sua idade como um número. Exemplo: 25");
            return;
          }
          user.age = parseInt(message.body.trim());
          await user.save();
          client.sendText(message.from, `Ótimo! Agora informe seu peso em kg. Exemplo: 75`);
          return;
        }

        if (!user.weight) {
          if (isNaN(message.body.trim())) {
            client.sendText(message.from, "❌ Informe seu peso corretamente. Exemplo: 75");
            return;
          }
          user.weight = parseFloat(message.body.trim());
          await user.save();
          client.sendText(message.from, `Agora me diga sua altura em cm. Exemplo: 180`);
          return;
        }

        if (!user.height) {
          if (isNaN(message.body.trim())) {
            client.sendText(message.from, "❌ Informe sua altura corretamente. Exemplo: 180");
            return;
          }
          user.height = parseFloat(message.body.trim());
          await user.save();
          client.sendText(
            message.from,
            `✅ Cadastro completo! Bem-vindo, ${user.name}! Agora, você possui alguma deficiência? (Responda com 'sim' ou 'não')`
          );
          return;
        }

        if (user.hasDisability === undefined) {
          const response = message.body.trim().toLowerCase();
          if (response === "sim") {
            user.hasDisability = true;
            await user.save();
            client.sendText(message.from, "Por favor, descreva sua deficiência.");
            return;
          } else if (response === "não" || response === "nao") {
            user.hasDisability = false;
            await user.save();
            client.sendText(message.from, "Você possui alguma restrição alimentar? (Responda com 'sim' ou 'não')");
            return;
          } else {
            client.sendText(message.from, "❌ Resposta inválida! Responda com 'sim' ou 'não'.");
            return;
          }
        }

        if (user.hasDisability && !user.disabilityDescription) {
          user.disabilityDescription = message.body.trim();
          await user.save();
          client.sendText(message.from, "Você possui alguma restrição alimentar? (Responda com 'sim' ou 'não')");
          return;
        }

        if (user.hasFoodRestriction === undefined) {
          const response = message.body.trim().toLowerCase();
          if (response === "sim") {
            user.hasFoodRestriction = true;
            await user.save();
            client.sendText(message.from, "Por favor, descreva suas restrições alimentares.");
            return;
          } else if (response === "não" || response === "nao") {
            user.hasFoodRestriction = false;
            await user.save();
            client.sendText(message.from, "Qual é o seu sexo? (Responda com 'masculino' ou 'feminino')");
            return;
          } else {
            client.sendText(message.from, "❌ Resposta inválida! Responda com 'sim' ou 'não'.");
            return;
          }
        }

        if (user.hasFoodRestriction && !user.foodRestrictionDescription) {
          user.foodRestrictionDescription = message.body.trim();
          await user.save();
          client.sendText(message.from, "Qual é o seu sexo? (Responda com 'masculino' ou 'feminino')");
          return;
        }

        if (!user.gender) {
          const gender = message.body.trim().toLowerCase();
          if (gender === "masculino" || gender === "feminino") {
            user.gender = gender;
            await user.save();
            client.sendText(
              message.from,
              `✅ Cadastro completo! Bem-vindo, ${user.name}! Agora, escolha seu objetivo:\n\n` +
              "1️⃣ Ganho de massa muscular 💪\n" +
              "2️⃣ Perder peso 🏃‍♂️\n" +
              "3️⃣ Definir músculos 🏆\n\n" +
              "Responda apenas com o número da sua escolha."
            );
            return;
          } else {
            client.sendText(message.from, "❌ Resposta inválida! Responda com 'masculino' ou 'feminino'.");
            return;
          }
        }

        if (!user.goal) {
          const choice = message.body.trim();
          let goal = "";

          if (choice === "1") goal = "Ganhar massa muscular 💪";
          else if (choice === "2") goal = "Perda de peso 🏃‍♂️";
          else if (choice === "3") goal = "Definição muscular 🏆";
          else {
            client.sendText(message.from, "❌ Opção inválida! Escolha um dos números abaixo:\n\n" +
              "1️⃣ Ganhar massa muscular 💪\n" +
              "2️⃣ Perder peso 🏃‍♂️\n" +
              "3️⃣ Definir músculos 🏆"
            );
            return;
          }

          user.goal = goal;
          await user.save();
            client.sendText(message.from, `Ótimo! Seu objetivo é *${goal}*. 🎯 A partir de agora serei seu assistente fitness e te ajudarei a *${goal}*. 💪 Como posso ajudar?`);
          return;
        }


        // 🔹 Processar outras mensagens normalmente
        let botResponse = await getGeminiResponse(message.body, message.from);
        console.log(`🤖 Resposta do Gemini AI para ${message.from}: ${botResponse}`);

        // 🔹 SALVAR A MENSAGEM NO BANCO DE DADOS
        await Message.create({
          phoneNumber: message.from,
          message: message.body,
          response: botResponse,
          timestamp: new Date()
        });
        console.log("💾 Mensagem salva no MongoDB.");

        // Enviar resposta ao usuário
        client.sendText(message.from, botResponse);
      } catch (error) {
        console.error("❌ Erro ao processar mensagem:", error);
      }
    }
  });
}

// 🔹 Função para obter resposta do Gemini AI
async function getGeminiResponse(userMessage, userPhone) {
  try {
    console.log("🔍 Enviando mensagem para Gemini AI:", userMessage);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 🔹 Buscar usuário no banco de dados
    let user = await User.findOne({ phoneNumber: userPhone });

    if (!user) {
      return "⚠️ Seu cadastro não foi encontrado. Por favor, inicie seu registro antes de prosseguir.";
    }

    // 🔹 Criar um objeto para armazenar possíveis atualizações do usuário
    let updateData = {}; 

    // 🔹 Criar um prompt com as informações do usuário
    let prompt = `
      🤖🏋️‍♂️🍎 Você é um assistente de academia e nutrição.
      🏋️‍♂️ O usuário **${user.name}** está buscando ajuda para ${user.goal}.
      🚫 ENVIE O TREINO DO USUARIO APENAS QUANDO O MESMO PEDIR.
      ❌ QUANDO O USUARIO DISSER ALGO NAO RELACIONADO A AREA DE SAUDE CORPORAL E MENTAL, RESPONDA COM UMA MENSAGEM DO TIPO: EU ESTOU AQUI PARA AJUDA-LO COM SUA DIETA E TREINO, NAO POSSUO CAPACIDADE DE TAIS ASSUNTOS.

      📊 **Informações do usuário**:
      - 📞 Número: ${user.phoneNumber}
      - 🎯 Objetivo: ${user.goal}
      - 👤 Idade: ${user.age} anos
      - ⚖️ Peso: ${user.weight} kg
      - 📏 Altura: ${user.height} cm
      - 🚻 Sexo: ${user.gender}
      - 🏋️ Plano de treino atual: ${user.workoutPlan || "Ainda não definido"}
      - 🍽 Plano de alimentação atual: ${user.mealPlan || "Ainda não definido"}
      - ♿ descrição da deficiência: ${user.disabilityDescription || "Não possui"}
      - 🚫 restrição alimentar: ${user.foodRestrictionDescription || "Não possui"}

      📜 **Histórico da conversa com o usuário:**  
      ${await getChatHistory(userPhone)}

      ❓ Pergunta do usuário: "${userMessage}"

      🔹 **Responda de forma personalizada, chamando o usuário pelo nome.**
      🔹 **Inclua emojis para tornar a resposta mais interativa.** 🎯🔥
    `;

    // 🔹 Se o usuário ainda não tem um objetivo definido, pedir para ele escolher
    if (!user.goal) {
      return "🏋️‍♂️ Qual é o seu objetivo? (Ex: ganhar massa muscular, perder peso, definir o corpo)";
    }

    // 🔹 Se não há plano de treino, geramos um novo
    if (!user.workoutPlan) {
      prompt += `\n🔹 Crie um plano de treino semanal para um usuário que quer ${user.goal}.`;
      const workoutResponse = await model.generateContent(prompt);
      updateData.workoutPlan = workoutResponse.response.text();
    }

    // 🔹 Se não há plano alimentar, geramos um novo
    if (!user.mealPlan) {
      prompt += `\n🔹 Agora, crie um plano de alimentação para um usuário que quer ${user.goal}, garantindo equilíbrio nutricional.`;
      const mealResponse = await model.generateContent(prompt);
      updateData.mealPlan = mealResponse.response.text();
    }

    // 🔹 Atualizar banco de dados apenas se novos planos forem gerados
    if (Object.keys(updateData).length > 0) {
      await User.updateOne({ phoneNumber: userPhone }, updateData);
      return "✅ Seu plano de treino e dieta foi gerado com sucesso! Digite 'meu plano' para visualizar.";
    }

    // 🔹 Se todas as informações já estiverem preenchidas, responder normalmente
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log("✅ Resposta do Gemini AI:", response);
    return response;
  } catch (error) {
    console.error("❌ Erro ao conectar ao Gemini AI:", error);
    return "⚠️ Ocorreu um erro ao acessar a IA. Verifique sua chave da API.";
  }
}

// 🔹 Função para recuperar o histórico de mensagens
async function getChatHistory(phoneNumber) {
  const history = await Message.find({ phoneNumber }).sort({ timestamp: -1 }).limit(5);
  return history.map((msg) => `Usuário: ${msg.message}\nBot: ${msg.response}`).join("\n");
}