export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  extracted_text?: string;
  ai_analysis?: string;
  analysis_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

/** Upload endpoint returns message and document_id */
export interface UploadResponse {
  message: string;
  document_id: number;
}
