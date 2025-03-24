import { PDFReader } from "@llamaindex/readers/pdf";
import { CSVReader } from "@llamaindex/readers/csv";
import { DocxReader } from "@llamaindex/readers/docx";
import { HTMLReader } from "@llamaindex/readers/html";
import { VectorStoreIndex, Document } from "llamaindex";
import { getStorageContext } from "../config/index";
import sharp from "sharp";
import Tesseract from "tesseract.js";
import XLSX from "xlsx";
import { downloadFile,  cleanupTempFiles, } from "./fileProcessor";

const mimeMap: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/html": "html",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/bmp": "bmp",
  "image/webp": "webp",
};

export async function generateFAQs(index: any, extractedText: string) {
  const queryEngine = index.asQueryEngine();
  const faqPrompt = `
    Based on the following document content, generate 3 frequently asked questions (FAQs).
    Document Content: "${extractedText}"
    Format: ["Question 1", "Question 2", "Question 3"]
  `;

  const response = await queryEngine.query({ query: faqPrompt });
  const faqs = response.message.content;

  return faqs;
}

async function processAndStoreExcel(filePath: string): Promise<string> {
  const workbook = XLSX.readFile(filePath);
  let extractedText = "";

  workbook.SheetNames.forEach((sheetName: any) => {
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    extractedText += JSON.stringify(sheetData) + "\n";
  });

  return extractedText;
}

async function processAndStoreImage(imagePath: string): Promise<string> {
  const processedImage = await sharp(imagePath).grayscale().toBuffer();
  const { data } = await Tesseract.recognize(processedImage, "eng");
  const extractedText = data.text.trim();

  return extractedText;
}

export async function processAndStoreDocument(file: any, userPhone: string) {
  const filePath = await downloadFile(file.url, mimeMap[file.mime]);
  let extractedText = "";

  switch (mimeMap[file.mime]) {
    case "pdf":
      const pdfReader = new PDFReader();
      extractedText = (await pdfReader.loadData(filePath))
        .map((doc: any) => doc.text)
        .join("\n");
      break;

    case "docx":
      const docxReader = new DocxReader();
      extractedText = (await docxReader.loadData(filePath))
        .map((doc: any) => doc.text)
        .join("\n");
      break;

    case "csv":
      const csvReader = new CSVReader();
      extractedText = (await csvReader.loadData(filePath))
        .map((doc: any) => doc.text)
        .join("\n");
      break;

    case "xlsx":
      extractedText = await processAndStoreExcel(filePath);
      break;

    case "html":
      const htmlReader = new HTMLReader();
      extractedText = (await htmlReader.loadData(filePath))
        .map((doc: any) => doc.text)
        .join("\n");
      break;

    case "jpg":
    case "png":
    case "jpeg":
    case "webp":
      extractedText = await processAndStoreImage(filePath);
      break;

    default:
      extractedText = "";
  }

  console.log(`Extracted Text: ${extractedText}`);

  if (!extractedText) {
    return { error: `Unsupported file type: ${file.type}` };
  }

  const documents = [
    new Document({ text: extractedText, metadata: { source: file.type } }),
  ];
  const ctx = await getStorageContext(userPhone);
  const index = await VectorStoreIndex.fromDocuments(documents, {
    storageContext: ctx,
  });

  console.log(
    `Embeddings stored for document: ${file.url}, user: ${userPhone}`
  );

  const faqs = await generateFAQs(index, extractedText);
  cleanupTempFiles();
  return faqs;
}

// 🔹 Function to Query Stored Document Embeddings
export async function chatWithDocument(userPhone: string, query: string) {
  const ctx = await getStorageContext(userPhone);
  const index = await VectorStoreIndex.init({ storageContext: ctx, nodes: [] });
  const retriever = index.asRetriever();
  const queryEngine = index.asQueryEngine({ retriever });
  const results = await queryEngine.query({ query });
  return results.message.content;
}