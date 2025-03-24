# WhatsApp RAG (Retrieval-Augmented Generation) with LlamaIndex

This project is a WhatsApp-based Retrieval-Augmented Generation (RAG) system that allows users to upload documents, extract text, generate FAQs, and interact with the content using natural language queries. The system leverages LlamaIndex for document processing, OpenAI/Groq/Gemini for language models, and Redis for storing FAQs and user preferences.

---

## Features

1. **Document Processing**:
   - Supports multiple file formats: PDF, DOCX, CSV, XLSX, HTML, and images (JPEG, PNG, BMP, WebP).
   - Extracts text from documents using appropriate readers (e.g., PDFReader, DocxReader).
   - Generates FAQs from the extracted text using LlamaIndex.

2. **Natural Language Interaction**:
   - Users can ask questions about the uploaded documents.
   - The system retrieves relevant answers using embeddings and a query engine.

3. **Model Selection**:
   - Users can choose between different language models (OpenAI GPT-4, Groq Llama3, Gemini).
   - Model preferences are stored in Redis for persistent user settings.

4. **Temporary File Management**:
   - Files are downloaded to a `temp` directory for processing.
   - Temporary files are cleaned up after processing to save disk space.

5. **Redis Integration**:
   - FAQs and user preferences are stored in Redis for quick retrieval.
   - Ensures a seamless user experience across sessions.

---

## Prerequisites

Before setting up the project, ensure you have the following:

1. **Node.js** (v18 or higher)
2. **Redis** (for storing FAQs and user preferences)
3. **API Keys**:
   - OpenAI API Key
   - Groq API Key
   - Google Gemini API Key
4. **WhatsApp Business API Access** (via Maytapi or another provider)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Daniyal-Qureshi/Whatsapp-RAG.git
cd Whatsapp-RAG



# Whatsapp-RAG Setup Guide

## 1. Install Dependencies
Install the required Node.js packages:

```bash
npm install
```

## 2. Set Up Environment Variables
Create a `.env` file in the root directory and add the following variables:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# PostgreSQL Database URL
POSTGRES_URL=postgresql://postgres.username:password@host:port/database

# Maytapi WhatsApp API Credentials
MAYTAPI_PRODUCT_ID=your-maytapi-product-id
MAYTAPI_TOKEN=your-maytapi-token
MAYTAPI_INSTANCE_ID=your-maytapi-instance-id

# DeepSeek API Key
DEEP_SEEK_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis Connection URL
REDIS_URL=redis://localhost:6379

# Groq API Key
GROQ_API_KEY=gsk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google API Key
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

## 3. Start Redis
Ensure Redis is running on your system. You can start it using:

```bash
redis-server
```

## 4. Run the Project
Start the application:

```bash
npm start
```

---

## Usage

### 1. Upload a Document
Send a document (PDF, DOCX, CSV, etc.) to the WhatsApp number associated with the project. The system will process the document and generate FAQs.

### 2. Interact with the Document
Once the FAQs are generated, you can:
- Reply with a number to select a FAQ and get an answer.
- Ask a custom question about the document.

### 3. Select a Language Model
If no model is selected, the system will prompt you to choose one:
1. OpenAI GPT-4  
2. Groq Llama3  
3. Gemini  

Reply with the number corresponding to your preferred model.

---


## Configuration

### 1. Supported File Types
The system supports the following file types:

| MIME Type | File Format |
|-----------|------------|
| `application/pdf` | PDF |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | DOCX |
| `application/msword` | DOC |
| `text/csv` | CSV |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | XLSX |
| `text/html` | HTML |
| `image/jpeg`, `image/png`, `image/bmp`, `image/webp` | Images |

### 2. Language Models
You can configure the language models in `src/config/index.ts`:

```typescript
const modelOptions: any = {
  "OpenAI GPT-4": new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  "Groq Llama3": new Groq({ model: "llama3-70b-8192", apiKey: process.env.GROQ_API_KEY }),
  "Gemini": new Gemini({ model: GEMINI_MODEL.GEMINI_PRO_1_5_FLASH })
};
```
