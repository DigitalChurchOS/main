import { AiCopilotProvider, AiTextResult, AiSubtitlesResult, AiClipsResult } from '../interfaces';

export class MockOpenAiDriver implements AiCopilotProvider {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;

    if (!config.apiKey) {
      throw new Error('Invalid OpenAI configuration: apiKey is required');
    }
  }

  async transcribe(audioUrl: string): Promise<AiTextResult> {
    console.log(`[MockOpenAi] Transcribing audio from: ${audioUrl}`);
    return {
      success: true,
      text: "This is a mock transcription of the sermon talking about walking in grace and experiencing faith in action.",
    };
  }

  async generateSubtitles(transcript: string, format: 'srt' | 'vtt'): Promise<AiSubtitlesResult> {
    console.log(`[MockOpenAi] Generating ${format} subtitles for transcript`);
    const subtitles = format === 'srt'
      ? "1\n00:00:01,000 --> 00:00:05,000\nThis is a mock subtitle in SRT format."
      : "WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nThis is a mock subtitle in VTT format.";
    return {
      success: true,
      subtitles,
    };
  }

  async summarize(text: string): Promise<AiTextResult> {
    console.log(`[MockOpenAi] Summarizing text`);
    const summary = "This message focuses on Ephesians 2 and walking in grace.\n\n" +
      "It reminds believers that salvation is a gift not earned by works.\n\n" +
      "Lastly, it challenges the church to extend that same grace to others daily.";
    return {
      success: true,
      text: summary,
    };
  }

  async suggestClips(text: string, options?: { numClips?: number; duration?: number; prompt?: string }): Promise<AiClipsResult> {
    const numClips = options?.numClips || 3;
    const duration = options?.duration || 60;
    const promptText = options?.prompt ? ` (Prompt: ${options.prompt})` : '';

    console.log(`[MockOpenAi] Analyzing text for ${numClips} clips of ${duration}s duration${promptText}`);

    const clips = [];
    for (let i = 0; i < numClips; i++) {
      const start = 60 * (i + 1);
      const end = start + duration;
      clips.push({
        start,
        end,
        description: `Mock clip suggestion #${i + 1} with duration ${duration}s${promptText}`,
      });
    }

    return {
      success: true,
      clips,
    };
  }

  async generateBlogDraft(text: string): Promise<AiTextResult> {
    console.log(`[MockOpenAi] Drafting blog post from text`);
    return {
      success: true,
      text: "<h1>Walking in Amazing Grace</h1><p>Here is a well-structured blog post draft transformed from the spoken sermon transcript...</p>",
    };
  }

  async generateDevotionalDraft(text: string): Promise<AiTextResult> {
    console.log(`[MockOpenAi] Drafting devotional from text`);
    return {
      success: true,
      text: "Day 1: What is Grace?\n\nDay 2: Salvation as a Gift\n\nDay 3: Faith in Action\n\nDay 4: Rest in God\n\nDay 5: Extending Grace",
    };
  }

  async generateSocialCaptions(text: string): Promise<AiTextResult> {
    console.log(`[MockOpenAi] Generating social media captions`);
    return {
      success: true,
      text: "Are we truly walking in grace? 💡 Check out this quick recap of Sunday's sermon. #Grace #Faith #Hope",
    };
  }

  async translateText(text: string, targetLanguage: string): Promise<AiTextResult> {
    console.log(`[MockOpenAi] Translating text to ${targetLanguage}`);
    return {
      success: true,
      text: `[Translated to ${targetLanguage}]: ${text}`,
    };
  }

  async generateAnnouncement(bulletPoints: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating announcement');
    return {
      success: true,
      text: `[AI Announcement]: Here is an engaging Sunday bulletin announcement based on: ${bulletPoints}`,
    };
  }

  async generateEmailDraft(topic: string, audience: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating email draft');
    return {
      success: true,
      text: `[AI Email Draft]: Subject: Update on ${topic}\n\nDear ${audience},\n\nHere is a newsletter about ${topic} for you.`,
    };
  }

  async generateSMSDraft(text: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating SMS draft');
    // Ensure <= 160 characters
    const condensed = text.length > 140 ? text.substring(0, 137) + '...' : text;
    return {
      success: true,
      text: `[AI SMS]: ${condensed}`,
    };
  }

  async generatePushNotification(text: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating push notification');
    const brief = text.length > 50 ? text.substring(0, 47) + '...' : text;
    return {
      success: true,
      text: `[AI Push]: ${brief} - Click to read!`,
    };
  }

  async generateCourseOutline(topic: string, durationWeeks: number): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating course outline');
    let outline = `[AI Course Outline for ${topic}]:`;
    for (let i = 1; i <= durationWeeks; i++) {
      outline += `\n- Week ${i}: Study guide and workbook on ${topic} part ${i}`;
    }
    return {
      success: true,
      text: outline,
    };
  }

  async generateQuiz(lessonContent: string, numQuestions: number): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating quiz');
    let quiz = `[AI Quiz based on: ${lessonContent}]:`;
    for (let i = 1; i <= numQuestions; i++) {
      quiz += `\nQ${i}: What is the core lesson? A) Faith B) Works C) None. (Answer: A)`;
    }
    return {
      success: true,
      text: quiz,
    };
  }

  async generateFAQ(policyDocument: string, question: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating FAQ reply');
    return {
      success: true,
      text: `[AI FAQ Reply]: According to: "${policyDocument}", the answer to your question "${question}" is yes.`,
    };
  }

  async generateCrmReply(visitorNote: string, tone: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating CRM follow-up reply');
    return {
      success: true,
      text: `[AI CRM Follow-up - Tone: ${tone}]: Dear friend, we received your note: "${visitorNote}". We look forward to connecting with you!`,
    };
  }

  async generateWorkflowSuggestions(churchDataJson: string): Promise<AiTextResult> {
    console.log('[MockOpenAi] Generating workflow suggestions');
    return {
      success: true,
      text: `[AI Workflow Suggestions]: Based on the provided data: "${churchDataJson}", we suggest setting up a follow-up sequence when a member checks in.`,
    };
  }
}
