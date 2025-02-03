const PDFDocument = require('pdfkit');
const fs = require('fs');

function generatePDF(userPhone) {
  const doc = new PDFDocument();
  const fileName = `planos/${userPhone}.pdf`;

  doc.pipe(fs.createWriteStream(fileName));

  doc.fontSize(16).text("Plano Personalizado de Treino e Nutrição", { align: "center" });
  doc.moveDown();
  doc.text("Treinos da Semana:");
  doc.text("- Segunda: Peito e Tríceps");
  doc.text("- Terça: Costas e Bíceps");
  doc.text("- Quarta: Cardio e Abdômen");
  doc.moveDown();
  doc.text("Plano Nutricional:");
  doc.text("- Café da manhã: Ovos, pão integral");
  doc.text("- Almoço: Frango, arroz integral, salada");
  doc.text("- Jantar: Omelete com vegetais");

  doc.end();
}

module.exports = { generatePDF };
