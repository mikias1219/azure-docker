# Azure AI Services — Purpose and Provisioning

This document maps each AI capability in the app to its **Azure resource**, **purpose**, **environment variables**, and how it is **provisioned**. Use it to verify that each service is built and provisioned for its intended purpose.

---

## 1. Document Intelligence (Form Recognizer)

| Item | Detail |
|------|--------|
| **Purpose** | Extract text, layout, tables, and structure from documents; prebuilt models for **invoices** and **business cards**. |
| **Azure resource** | Cognitive Services — **Form Recognizer** (Document Intelligence). |
| **Provisioning** | `scripts/create_all_azure_services.sh` creates `document-intelligence-ai102` (kind: `FormRecognizer`, SKU: `S0`). |
| **Env vars** | `AZURE_FORM_RECOGNIZER_ENDPOINT`, `AZURE_FORM_RECOGNIZER_KEY`. |
| **Backend** | `app/azure_services.py` — `DocumentAnalysisClient`; prebuilt-document / prebuilt-read; optional OpenAI for analysis. |
| **Status** | Provisioned and wired for document extraction and prebuilt invoice/business card. |

---

## 2. Azure OpenAI (Chat + Embeddings)

| Item | Detail |
|------|--------|
| **Purpose** | Chat for document Q&A and optional analysis; **embeddings** for RAG pipeline. |
| **Azure resource** | Cognitive Services — **OpenAI**. |
| **Provisioning** | `create_all_azure_services.sh` creates `openai-ai102` (kind: `OpenAI`, SKU: `S0`). Deploy chat (e.g. gpt-35-turbo) and embedding (e.g. text-embedding-ada-002) in Azure OpenAI Studio. |
| **Env vars** | `OPENAI_API_KEY`, `OPENAI_API_BASE`, `OPENAI_DEPLOYMENT_NAME`, `OPENAI_API_VERSION`, `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` (or `OPENAI_EMBEDDING_DEPLOYMENT_NAME`). |
| **Backend** | `app/azure_services.py` (chat), `app/rag_service.py` (embeddings + chat), `app/info_extraction_service.py` (optional extraction). |
| **Status** | Provisioned; deployments must be created in Azure OpenAI Studio. |

---

## 3. Text Analytics (Azure AI Language)

| Item | Detail |
|------|--------|
| **Purpose** | **Language detection**, **sentiment**, **key phrases**, **named entities**. |
| **Azure resource** | Cognitive Services — **Text Analytics** (Azure AI Language). |
| **Provisioning** | Same Language resource as QnA and CLU: `language-ai102` (kind: `TextAnalytics`, SKU: `S`). |
| **Env vars** | `AZURE_LANGUAGE_ENDPOINT`, `AZURE_LANGUAGE_KEY`. |
| **Backend** | `app/text_analytics.py` — `TextAnalyticsClient`. |
| **Status** | Provisioned and used for text analytics only (purpose-built). |

---

## 4. Question Answering (QnA) — Azure AI Language

| Item | Detail |
|------|--------|
| **Purpose** | Answer questions from a **knowledge base** (QnA project). Optional LLM enhancement for presentation. |
| **Azure resource** | Same **Azure AI Language** resource; QnA Maker / Language question answering. |
| **Provisioning** | Same as Text Analytics; requires a **QnA project** (e.g. `LearnFAQ`) and **deployment** (e.g. `production`) in Language Studio. |
| **Env vars** | `AZURE_LANGUAGE_ENDPOINT`, `AZURE_LANGUAGE_KEY`, `AZURE_QNA_PROJECT_NAME`, `AZURE_QNA_DEPLOYMENT_NAME`. Optional enhancement: `OPENAI_API_KEY`, `OPENAI_API_BASE`, `OPENAI_DEPLOYMENT_NAME`. |
| **Backend** | `app/question_answering.py` — `QuestionAnsweringClient`; optional enhancement via OpenAI. |
| **Status** | Provisioned; QnA project/deployment must be created in Language Studio. Enhancement uses same OpenAI env as rest of app. |

---

## 5. CLU — Clock (Conversational Language Understanding)

| Item | Detail |
|------|--------|
| **Purpose** | **Intent** and **entity** recognition for conversational clock (e.g. GetTime, GetDate; location, time). |
| **Azure resource** | Same **Azure AI Language** resource; **Conversational Language Understanding** (CLU). |
| **Provisioning** | Same Language resource; requires a **CLU project** named `Clock` with deployment `production` in Language Studio. |
| **Env vars** | `AZURE_LANGUAGE_ENDPOINT`, `AZURE_LANGUAGE_KEY`. (Project/deployment names are fixed in code: `Clock`, `production`.) |
| **Backend** | `app/clock_service.py` — `ConversationAnalysisClient`. |
| **Status** | Provisioned; CLU project “Clock” must be created and deployed in Language Studio. |

---

## 6. Azure AI Vision (Computer Vision)

| Item | Detail |
|------|--------|
| **Purpose** | **Image analysis**: caption, tags, objects, people; **read (OCR)**. |
| **Azure resource** | Cognitive Services — **Computer Vision** (Azure AI Vision). |
| **Provisioning** | `create_all_azure_services.sh` creates `ai-vision-ai102` (kind: `ComputerVision`, SKU: `S1`). |
| **Env vars** | `AZURE_AI_VISION_ENDPOINT`, `AZURE_AI_VISION_KEY`. |
| **Backend** | `app/ai_vision_service.py` — `ImageAnalysisClient`, `VisualFeatures`. |
| **Status** | Provisioned and used for image analysis and OCR (purpose-built). |

---

## 7. Azure AI Search (Knowledge Mining + RAG)

| Item | Detail |
|------|--------|
| **Purpose** | **Keyword (and vector) search** over indexed content; used by **Knowledge Mining** and **RAG** (vector index). |
| **Azure resource** | **Azure AI Search** (search service). |
| **Provisioning** | `create_all_azure_services.sh` creates a search service (e.g. `ai102search`, SKU: `basic`). |
| **Env vars** | `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY`, `AZURE_SEARCH_INDEX_NAME` (default `rag-content-index`). |
| **Backend** | `app/search_service.py` — keyword search; `app/rag_service.py` — vector index, RAG pipeline. |
| **Status** | Provisioned; RAG index is created on first use by `ensure_rag_index()`. |

---

## 8. RAG Pipeline (Document Intelligence + OpenAI + Search)

| Item | Detail |
|------|--------|
| **Purpose** | **Retrieval-augmented generation**: ingest documents (chunk → embed → index), then answer questions with cited sources. |
| **Azure resources** | **Document Intelligence** (extract text), **Azure OpenAI** (embeddings + chat), **Azure AI Search** (vector index). |
| **Provisioning** | All three services above; RAG index created by app. |
| **Env vars** | Same as Document Intelligence, OpenAI, and Search; plus `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME`. |
| **Backend** | `app/rag_service.py` — chunking, embeddings, index, query, chat. |
| **Status** | Built from the three services; purpose is RAG over your documents. |

---

## 9. Information Extraction (Invoice / Business Card)

| Item | Detail |
|------|--------|
| **Purpose** | **Structured extraction** using Document Intelligence **prebuilt** models: invoice (vendor, totals, dates), business card (name, company, phone, email). Business card can be augmented with OpenAI from raw text. |
| **Azure resources** | **Document Intelligence** (prebuilt-invoice, prebuilt-businessCard); optional **OpenAI**. |
| **Provisioning** | Same as Document Intelligence (and OpenAI if used). |
| **Env vars** | Same as Document Intelligence and OpenAI. |
| **Backend** | `app/azure_services.py` (analyze_invoice, analyze_business_card), `app/info_extraction_service.py`, `app/api/info_extraction_router.py`. |
| **Status** | Purpose-built on Document Intelligence prebuilt models. |

---

## 10. Azure AI Speech

| Item | Detail |
|------|--------|
| **Purpose** | **Speech-to-text (STT)** and **text-to-speech (TTS)**. |
| **Azure resource** | Cognitive Services — **Speech Services**. |
| **Provisioning** | `create_all_azure_services.sh` creates `ai-speech-ai102` (kind: `SpeechServices`, SKU: `S0`). |
| **Env vars** | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`. |
| **Backend** | `app/speech_service.py` — `SpeechConfig`, `SpeechRecognizer`, synthesis. |
| **Status** | Provisioned; credentials exported in CI. If not set, app runs in demo mode. |

---

## Summary: Provisioning vs purpose

| Service | Azure resource / type | Purpose | Provisioned in script |
|---------|------------------------|---------|------------------------|
| Document Intelligence | Form Recognizer | Document/text extraction, invoice, business card | Yes |
| OpenAI | OpenAI | Chat, embeddings (RAG + optional analysis) | Yes |
| Text Analytics | AI Language (TextAnalytics) | Language, sentiment, key phrases, entities | Yes |
| QnA | AI Language | Knowledge base Q&A | Yes (project in Studio) |
| CLU (Clock) | AI Language (CLU) | Intent/entity for clock | Yes (project in Studio) |
| AI Vision | Computer Vision | Image caption, tags, objects, people, OCR | Yes |
| Search | Azure AI Search | Keyword/vector search, RAG index | Yes |
| RAG | DI + OpenAI + Search | Ingest + answer with sources | Via above three |
| Info Extraction | Document Intelligence (+ optional OpenAI) | Invoice/business card fields | Via DI (+ OpenAI) |
| Speech | Speech Services | STT, TTS | Yes |

Credentials are injected by `scripts/get_credentials_for_ci.sh` (or manually via `.env`). See `.env.example` for all variable names.
