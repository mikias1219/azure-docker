/**
 * Full functionality and usage copy for each Azure AI service.
 * Shown at the top of each service tab so users see what the service does and how to use it.
 */
export interface ServiceUsageContent {
  title: string;
  whatItDoes: string;
  capabilities: string[];
  steps: string[];
  input: string;
  output: string;
}

export const SERVICE_USAGE: Record<string, ServiceUsageContent> = {
  documents: {
    title: 'Document Intelligence',
    whatItDoes:
      'Azure Document Intelligence (Form Recognizer) extracts text, structure, tables, and key-value pairs from documents. It supports prebuilt models for invoices and business cards, and general layout analysis for any PDF or image.',
    capabilities: [
      'Extract text and layout from PDFs and images',
      'Prebuilt Invoice model: vendor, customer, totals, dates',
      'Prebuilt Business Card model: name, company, phone, email',
      'Optional AI analysis of extracted content via OpenAI',
    ],
    steps: [
      'Upload a document (PDF or image) in the Upload section below.',
      'Select the document from the list to open it.',
      'View extracted text and any AI-generated analysis in the viewer.',
      'For structured data: go to "Structured extraction", choose Invoice or Business Card, upload a file, and run extraction.',
    ],
    input: 'PDF or image file (e.g. invoice, business card, or any document).',
    output: 'Extracted text, layout, and—for Invoice/Business Card—structured fields (names, amounts, dates, etc.).',
  },
  vision: {
    title: 'Computer Vision',
    whatItDoes:
      'Azure AI Vision analyzes images to generate captions, tags, object and people detection, and can read text (OCR). You choose which features to run (caption, tags, objects, people, read) and get structured results.',
    capabilities: [
      'Image captioning (description of the image)',
      'Tags (objects and scene classification)',
      'Object detection (bounding boxes)',
      'People detection',
      'Read text (OCR) from the image',
    ],
    steps: [
      'Upload an image using the drop zone or file picker.',
      'Select the features you want: Caption, Tags, Objects, People, and/or Read (OCR).',
      'Click "Analyze" to run the selected features.',
      'Review the results: caption, tags, objects, and—if Read was selected—the extracted text.',
    ],
    input: 'An image file (e.g. JPEG, PNG).',
    output: 'Caption, tags, detected objects/people with confidence scores, and optionally the full OCR text.',
  },
  'text-analytics': {
    title: 'Natural Language',
    whatItDoes:
      'This tab combines three Azure AI Language features: Text Analytics (language, sentiment, key phrases, entities), Question Answering (QnA over a knowledge base), and CLU (Conversational Language Understanding) for intent and entity extraction—e.g. the Clock project for time/date queries.',
    capabilities: [
      'Text Analytics: language detection, sentiment, key phrases, named entities',
      'Question Answering: ask a question, get an answer from your QnA knowledge base',
      'CLU (Clock): intent recognition and entities for phrases like "What time is it?"',
    ],
    steps: [
      'Text Analytics: Paste text in the "Analyze text" lab, then click Run. Review language, sentiment, key phrases, and entities.',
      'Question Answering: Enter a question in the QnA lab and click Run. The answer and confidence are shown.',
      'CLU (Clock): Enter a phrase (e.g. "What time is it in Tokyo?") in the CLU lab and click Run. See the detected intent and entities.',
    ],
    input: 'Text (for Text Analytics) or a question/phrase (for QnA or CLU).',
    output: 'Language, sentiment, key phrases, entities; or QnA answer with confidence; or CLU intent and entities (e.g. time, location).',
  },
  speech: {
    title: 'Speech',
    whatItDoes:
      'Azure AI Speech provides speech-to-text (transcription) and text-to-speech (synthesis). Upload an audio file to get a transcript, or enter text to generate speech and play it.',
    capabilities: [
      'Speech-to-Text (STT): transcribe audio to text',
      'Text-to-Speech (TTS): synthesize natural-sounding speech from text',
    ],
    steps: [
      'Speech-to-extraction: Select an audio file (e.g. WAV, MP3), then click "Execute Transcription". The transcript appears below.',
      'Text-to-Speech: Type or paste text in the TTS box, then click "Synthesize". The generated audio can be played when supported.',
    ],
    input: 'For STT: an audio file. For TTS: text.',
    output: 'For STT: transcript and confidence. For TTS: synthesized audio (and metadata such as voice and duration).',
  },
  knowledge: {
    title: 'Knowledge Mining',
    whatItDoes:
      'Azure AI Search (formerly Cognitive Search) indexes your content so you can run keyword and semantic search. This lab lets you query the index and see matching documents and scores. You can populate the index by ingesting documents in the RAG tab.',
    capabilities: [
      'Keyword and vector search over your indexed documents',
      'View matching documents with relevance scores and content snippets',
    ],
    steps: [
      'Enter a search query in the search box (e.g. a keyword or phrase).',
      'Click "Run miner" (or press Enter) to execute the search.',
      'Review the list of matching documents, scores, and content previews.',
    ],
    input: 'A search query (text).',
    output: 'List of matching documents with file name, relevance score, and content preview.',
  },
  rag: {
    title: 'Generative AI (RAG)',
    whatItDoes:
      'RAG (Retrieval-Augmented Generation) ingests your documents into a vector index, then answers questions by retrieving relevant chunks and generating an answer with Azure OpenAI. You see the answer plus the source chunks used.',
    capabilities: [
      'Ingest documents (by document ID from the Documents tab) into the vector index',
      'Ask questions in natural language',
      'Get answers grounded in your documents, with source citations',
    ],
    steps: [
      'Ensure the RAG index exists (the app can create it when you first run a query).',
      'To add content: upload documents in the Document Intelligence tab; ingestion into the RAG index may be done via the backend or separate ingest flow.',
      'Type your question in the question box below and click "Run pipeline".',
      'View the generated answer and the source chunks used to produce it in the results area.',
    ],
    input: 'Document(s) to ingest (via document ID), and a natural-language question.',
    output: 'An answer generated by Azure OpenAI, plus the list of source chunks used for the answer.',
  },
};
