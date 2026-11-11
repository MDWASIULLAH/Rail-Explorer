export type SwapReasonCategory =
  | 'FAMILY_PROXIMITY'
  | 'SENIOR_CITIZEN'
  | 'MEDICAL_CONDITION'
  | 'PREFER_LOWER'
  | 'PREFER_WINDOW'
  | 'TRAVELING_WITH_INFANT';

export interface SwapOffer {
  id: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  fromStation: string;
  toStation: string;
  currentCoach: string; // e.g. S4
  currentBerth: number; // e.g. 42
  currentBerthType: 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'CB';
  currentCoachClass: string; // e.g. Sleeper Class (SL), AC 3-Tier (3A)
  desiredCoaches?: string[]; // e.g. ["S1", "S2"] or empty for any
  desiredBerthTypes?: ('LB' | 'MB' | 'UB' | 'SL' | 'SU')[]; // empty/undefined means flexible
  desiredBerthNumber?: number; // soft preference; not a reservation or guarantee
  reasonCategory: SwapReasonCategory;
  reasonDescription: string;
  passengerName: string;
  passengerAge?: number;
  passengerGender?: 'M' | 'F' | 'O';
  status: 'AVAILABLE' | 'REQUEST_PENDING' | 'SWAP_ACCEPTED';
  createdAt: string;
  expiresAt?: string;
  contactMasked?: string;
  isCurrentUser?: boolean;
  userEmail?: string;
  userId?: string;
  acceptedProposal?: SwapProposal;
  acceptedAt?: string;
}

export interface SwapProposal {
  id: string;
  offerId: string;
  targetTrainNumber?: string;
  targetCoach?: string;
  targetBerth?: number;
  targetBerthType?: string;
  targetPassengerName?: string;
  proposerName: string;
  proposerEmail?: string;
  proposerUserId?: string;
  proposerCoach: string;
  proposerBerth: number;
  proposerBerthType: 'LB' | 'MB' | 'UB' | 'SL' | 'SU';
  proposerPhone?: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  isCurrentUser?: boolean;
}
