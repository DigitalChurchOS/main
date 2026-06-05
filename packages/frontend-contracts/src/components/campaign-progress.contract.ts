export interface CampaignProgressContract {
  campaignId: string;
  targetAmount: number;
  currentAmount: number;
  donorsCount: number;
  percentComplete: number;
  progressColor?: string;
}
