/**
 * Standard interfaces for the polymorphically dispatched integration drivers.
 */

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSProvider {
  /** Sends a text message to a specific recipient */
  sendSMS(to: string, message: string): Promise<SMSResult>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  clientSecret?: string;
  error?: string;
}

export interface PaymentProvider {
  /** Initiates a transaction flow */
  createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<PaymentResult>;
}

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileKey?: string;
  error?: string;
}

export interface StorageProvider {
  /** Uploads files to storage bucket (S3, R2, etc.) */
  uploadFile(fileName: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  /** Deletes physical file from remote server */
  deleteFile(fileKey: string): Promise<void>;
}

export interface AiTextResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface AiSubtitlesResult {
  success: boolean;
  subtitles?: string; // SRT or VTT subtitles
  error?: string;
}

export interface AiClipsResult {
  success: boolean;
  clips?: Array<{ start: number; end: number; description: string }>;
  error?: string;
}

export interface AiCopilotProvider {
  transcribe(audioUrl: string): Promise<AiTextResult>;
  generateSubtitles(transcript: string, format: 'srt' | 'vtt'): Promise<AiSubtitlesResult>;
  summarize(text: string): Promise<AiTextResult>;
  suggestClips(text: string, options?: { numClips?: number; duration?: number; prompt?: string }): Promise<AiClipsResult>;
  generateBlogDraft(text: string): Promise<AiTextResult>;
  generateDevotionalDraft(text: string): Promise<AiTextResult>;
  generateSocialCaptions(text: string): Promise<AiTextResult>;
  translateText(text: string, targetLanguage: string): Promise<AiTextResult>;
  generateAnnouncement(bulletPoints: string): Promise<AiTextResult>;
  generateEmailDraft(topic: string, audience: string): Promise<AiTextResult>;
  generateSMSDraft(text: string): Promise<AiTextResult>;
  generatePushNotification(text: string): Promise<AiTextResult>;
  generateCourseOutline(topic: string, durationWeeks: number): Promise<AiTextResult>;
  generateQuiz(lessonContent: string, numQuestions: number): Promise<AiTextResult>;
  generateFAQ(policyDocument: string, question: string): Promise<AiTextResult>;
  generateCrmReply(visitorNote: string, tone: string): Promise<AiTextResult>;
  generateWorkflowSuggestions(churchDataJson: string): Promise<AiTextResult>;
}
