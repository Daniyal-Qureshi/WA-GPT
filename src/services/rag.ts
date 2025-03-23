import { PDFReader } from "@llamaindex/readers/pdf";
import { CSVReader } from "@llamaindex/readers/csv";
import { DocxReader } from "@llamaindex/readers/docx";
import { HTMLReader } from "@llamaindex/readers/html";
import { VectorStoreIndex, Settings, OpenAI } from "llamaindex";
import { Document } from "@llamaindex/core/schema";
import { getStorageContext } from "../config/index";
import dotenv from "dotenv";
import path from "path";
import sharp from "sharp";
import axios from "axios";
import Tesseract from "tesseract.js";
import XLSX from "xlsx";
import fs from "fs";


const mimeMap: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/msword": "doc",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/html": "html",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/bmp": "bmp",
  "image/webp": "webp",
};

Settings.llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Function to Download Files from URLs
async function downloadFile(
  fileUrl: string,
  outputPath: string
): Promise<string> {
  try {
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "arraybuffer",
    });
    fs.writeFileSync(outputPath, response.data);
    return outputPath;
  } catch (error: any) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

export async function generateFAQs(index: any) {
  const queryEngine = index.asQueryEngine();
  const faqPrompt = `
    Based on the stored document content, generate 3 frequently asked questions (FAQs).
    Format: ["Question 1", "Question 2", "Question 3"]
  `;

  const response = await queryEngine.query({ query: faqPrompt });
  const faqs = response.message.content;

  console.log("Generated FAQs:", faqs);
  return faqs;
}

async function processAndStoreExcel(filePath: string, userPhone: string) {
  const workbook = XLSX.readFile(filePath);
  let extractedText = "";

  workbook.SheetNames.forEach((sheetName: any) => {
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    extractedText += JSON.stringify(sheetData) + "\n";
  });

  if (!extractedText) {
    throw new Error("No data extracted from Excel file");
  }

  return extractedText;
}

async function processAndStoreImage(imagePath: string) {
  const processedImage = await sharp(imagePath).grayscale().toBuffer();
  const { data } = await Tesseract.recognize(processedImage, "eng");
  const extractedText = data.text.trim();

  if (!extractedText) {
    throw new Error("No text extracted from image");
  }

  return extractedText;
}

export async function processAndStoreDocument(file: any, userPhone: string) {
  const filePath = await downloadFile(file.url, mimeMap[file.mime]);

  let extractedText = "";

  switch (file.type) {
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
      extractedText = await processAndStoreExcel(filePath, userPhone);
      break;
    case "html":
      const htmlReader = new HTMLReader();
      extractedText = (await htmlReader.loadData(filePath))
        .map((doc: any) => doc.text)
        .join("\n");
      break;
    case "image":
      extractedText = await processAndStoreImage(filePath);
      break;

    default:
      throw new Error(`Unsupported file type: ${file.type}`);
  }

  console.log(`Extracted Text: ${extractedText}`);

  if (!extractedText) {
    throw new Error("No text extracted from document");
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

  const faqs = await generateFAQs(index);
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
