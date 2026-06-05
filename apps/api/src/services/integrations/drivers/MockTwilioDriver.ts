import { SMSProvider, SMSResult } from '../interfaces';

export class MockTwilioDriver implements SMSProvider {
  private accountSid: string;
  private fromNumber: string;

  constructor(config: { accountSid: string; authToken: string; fromNumber: string }) {
    this.accountSid = config.accountSid;
    this.fromNumber = config.fromNumber;

    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      throw new Error('Invalid Twilio configuration parameters');
    }
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    console.log(`[MockTwilio] Sending SMS from ${this.fromNumber} to ${to}: "${message}"`);
    return {
      success: true,
      messageId: `tw_msg_${Math.random().toString(36).substring(2, 11)}`,
    };
  }
}
