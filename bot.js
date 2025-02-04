require("dotenv").config();
const venom = require("venom-bot");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔹 Importação dos modelos do MongoDB
const User = require("./models/User");
const Message = require("./models/Message");

// 🔹 Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Conectado ao MongoDB Local"))
.catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// 🔹 Configuração do Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Inicializar o WhatsApp Bot com Venom
venom.create({
  session: "FitAI-Session", // Nome da sessão
  multidevice: true, // Para suportar o WhatsApp Web atualizado
  headless: "new" // Corrigido para evitar avisos do Puppeteer
})
.then((client) => start(client)).catch((error) => console.log("❌ Erro ao iniciar o bot:", error));

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
            `✅ Cadastro completo! Bem-vindo, ${user.name}! Agora, escolha seu objetivo:\n\n` +
            "1️⃣ Ganho de massa muscular 💪\n" +
            "2️⃣ Perder peso 🏃‍♂️\n" +
            "3️⃣ Definir músculos 🏆\n\n" +
            "Responda apenas com o número da sua escolha."
          );
          return;
        }

        if (!user.goal) {
          const choice = message.body.trim();
          let goal = "";

          if (choice === "1") goal = "Ganho de massa muscular 💪";
          else if (choice === "2") goal = "Perda de peso 🏃‍♂️";
          else if (choice === "3") goal = "Definição muscular 🏆";
          else {
            client.sendText(message.from, "❌ Opção inválida! Escolha um dos números abaixo:\n\n" +
              "1️⃣ Ganho de massa muscular 💪\n" +
              "2️⃣ Perder peso 🏃‍♂️\n" +
              "3️⃣ Definir músculos 🏆"
            );
            return;
          }

          user.goal = goal;
          await user.save();
          client.sendText(message.from, `Ótimo! Seu objetivo é **${goal}**. Agora posso montar seu plano. Digite "montar plano" para começar.`);
          return;
        }

        // 🔹 Atualizar dieta ou treino
        if (message.body.toLowerCase().includes("alterar treino")) {
          client.sendText(message.from, "Certo! Vou gerar um novo plano de treino para você. Aguarde...");
          user.workoutPlan = await getGeminiResponse("Gerar um novo plano de treino para " + user.goal, message.from);
          await user.save();
          client.sendText(message.from, "✅ Seu novo plano de treino foi atualizado!");
          return;
        }

        if (message.body.toLowerCase().includes("alterar dieta")) {
          client.sendText(message.from, "Certo! Vou gerar um novo plano alimentar para você. Aguarde...");
          user.mealPlan = await getGeminiResponse("Gerar um novo plano de dieta para " + user.goal, message.from);
          await user.save();
          client.sendText(message.from, "✅ Sua nova dieta foi atualizada!");
          return;
        }

        // 🔹 Verificar se o usuário quer ver seu plano atual
        if (message.body.toLowerCase() === "meu plano") {
          client.sendText(
            message.from,
            `🏋️‍♂️ **Seu Plano de Treino:**\n${user.workoutPlan || "Nenhum plano salvo."}\n\n` +
            `🍽 **Seu Plano Alimentar:**\n${user.mealPlan || "Nenhuma dieta salva."}`
          );
          return;
        }

        // 🔹 Se o usuário pedir para montar um novo plano
        if (message.body.toLowerCase() === "montar plano") {
          client.sendText(message.from, "Certo! Vou gerar um novo plano para você. Aguarde um momento...");
          let botResponse = await getGeminiResponse("Criar um novo plano de treino e dieta", message.from);
          client.sendText(message.from, botResponse);
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

    const history = await getChatHistory(userPhone);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 🔹 Buscar o usuário no banco de dados
    let user = await User.findOne({ phoneNumber: userPhone });

    if (!user) {
      return "⚠️ Seu cadastro não foi encontrado. Por favor, inicie seu registro antes de prosseguir.";
    }

    // 🔹 Definir nome do usuário corretamente
    const userName = user.name || "usuário";

    let updateData = {}; // Objeto para armazenar atualizações do usuário

    // 🔹 Criando um prompt personalizado para a IA entender o contexto
    let prompt = `
      Você está conversando com ${userName}. Ele deseja ajuda com *treino e dieta*.
      Personalize suas respostas chamando o usuário pelo nome sempre que possível.

      📌 **Histórico da conversa com o usuário:**  
      ${history}  

      💬 Pergunta do usuário: "${userMessage}"

      Você é um assistente de academia e nutrição 🤖🏋️‍♂️🍎.
      O usuário deseja ajuda com *treino e dieta*.
      **Use emojis nas respostas** para torná-las mais interativas. 🎯🔥
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


// 🔹 Função para recuperar o histórico de mensagens recentes
async function getChatHistory(phoneNumber) {
  const history = await Message.find({ phoneNumber }).sort({ timestamp: -1 }).limit(5);
  return history.map(msg => `Usuário: ${msg.message}\nBot: ${msg.response}`).join("\n");
}