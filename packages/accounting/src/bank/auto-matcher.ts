// D3 Bank Auto-Matching Engine - Intelligent Transaction Matching
import { BankTransactionImport } from "./csv-import";

export interface MatchCandidate {
  type: "PAYMENT" | "RECEIPT" | "BILL" | "INVOICE";
  id: string;
  number: string;
  date: Date;
  amount: number;
  description: string;
  supplierId?: string;
  customerId?: string;
  reference?: string;
}

export interface MatchResult {
  transactionId: string;
  candidate: MatchCandidate;
  confidence: number; // 0-100
  matchReasons: string[];
  amountDifference: number;
  dateDifference: number; // days
}

export interface AutoMatchResult {
  matches: MatchResult[];
  unmatched: BankTransactionImport[];
  summary: {
    totalTransactions: number;
    automaticMatches: number;
    suggestedMatches: number;
    unmatched: number;
    averageConfidence: number;
  };
}

export interface MatchingConfig {
  // Confidence thresholds
  autoMatchThreshold: number; // Auto-match if confidence >= this (default: 90)
  suggestMatchThreshold: number; // Suggest if confidence >= this (default: 70)

  // Matching tolerances
  amountTolerance: number; // Amount difference tolerance (default: 0.01)
  dateTolerance: number; // Date difference tolerance in days (default: 7)

  // Matching weights
  exactAmountWeight: number; // Weight for exact amount match (default: 40)
  dateProximityWeight: number; // Weight for date proximity (default: 20)
  referenceMatchWeight: number; // Weight for reference match (default: 25)
  descriptionMatchWeight: number; // Weight for description similarity (default: 15)

  // Fuzzy matching settings
  descriptionSimilarityThreshold: number; // Min similarity for description match (default: 0.6)
  enableFuzzyMatching: boolean; // Enable fuzzy string matching (default: true)
}

const DEFAULT_CONFIG: MatchingConfig = {
  autoMatchThreshold: 90,
  suggestMatchThreshold: 70,
  amountTolerance: 0.01,
  dateTolerance: 7,
  exactAmountWeight: 40,
  dateProximityWeight: 20,
  referenceMatchWeight: 25,
  descriptionMatchWeight: 15,
  descriptionSimilarityThreshold: 0.6,
  enableFuzzyMatching: true,
};

/**
 * Auto-match bank transactions with payment/receipt candidates
 */
export async function autoMatchTransactions(
  transactions: BankTransactionImport[],
  candidates: MatchCandidate[],
  config: Partial<MatchingConfig> = {},
): Promise<AutoMatchResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const matches: MatchResult[] = [];
  const unmatched: BankTransactionImport[] = [];

  for (const transaction of transactions) {
    const transactionId = generateTransactionId(transaction);
    const bestMatch = findBestMatch(transaction, candidates, fullConfig);

    if (bestMatch && bestMatch.confidence >= fullConfig.suggestMatchThreshold) {
      matches.push({
        transactionId,
        candidate: bestMatch.candidate,
        confidence: bestMatch.confidence,
        matchReasons: bestMatch.matchReasons,
        amountDifference: bestMatch.amountDifference,
        dateDifference: bestMatch.dateDifference,
      });
    } else {
      unmatched.push(transaction);
    }
  }

  // Calculate summary statistics
  const automaticMatches = matches.filter(
    m => m.confidence >= fullConfig.autoMatchThreshold,
  ).length;
  const suggestedMatches = matches.filter(
    m =>
      m.confidence >= fullConfig.suggestMatchThreshold &&
      m.confidence < fullConfig.autoMatchThreshold,
  ).length;

  const averageConfidence =
    matches.length > 0 ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0;

  return {
    matches,
    unmatched,
    summary: {
      totalTransactions: transactions.length,
      automaticMatches,
      suggestedMatches,
      unmatched: unmatched.length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
    },
  };
}

/**
 * Find the best match for a transaction
 */
function findBestMatch(
  transaction: BankTransactionImport,
  candidates: MatchCandidate[],
  config: MatchingConfig,
): (MatchResult & { candidate: MatchCandidate }) | null {
  let bestMatch: (MatchResult & { candidate: MatchCandidate }) | null = null;
  let bestConfidence = 0;

  // Determine transaction type
  const isOutgoing = transaction.debitAmount > 0;

  for (const candidate of candidates) {
    // Skip candidates that don't match transaction direction
    const candidateIsOutgoing = candidate.type === "PAYMENT" || candidate.type === "BILL";
    if (isOutgoing !== candidateIsOutgoing) {
      continue;
    }

    const matchScore = calculateMatchScore(transaction, candidate, config);

    if (matchScore.confidence > bestConfidence) {
      bestConfidence = matchScore.confidence;
      bestMatch = {
        transactionId: generateTransactionId(transaction),
        candidate,
        confidence: matchScore.confidence,
        matchReasons: matchScore.reasons,
        amountDifference: matchScore.amountDifference,
        dateDifference: matchScore.dateDifference,
      };
    }
  }

  return bestMatch;
}

/**
 * Calculate match score between transaction and candidate
 */
function calculateMatchScore(
  transaction: BankTransactionImport,
  candidate: MatchCandidate,
  config: MatchingConfig,
): {
  confidence: number;
  reasons: string[];
  amountDifference: number;
  dateDifference: number;
} {
  const reasons: string[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // Calculate transaction amount
  const transactionAmount =
    transaction.debitAmount > 0 ? transaction.debitAmount : transaction.creditAmount;
  const amountDifference = Math.abs(transactionAmount - candidate.amount);

  // Calculate date difference in days
  const dateDifference = Math.abs(
    (transaction.transactionDate.getTime() - candidate.date.getTime()) / (1000 * 60 * 60 * 24),
  );

  // 1. Amount matching
  maxPossibleScore += config.exactAmountWeight;
  if (amountDifference <= config.amountTolerance) {
    totalScore += config.exactAmountWeight;
    reasons.push("Exact amount match");
  } else if (amountDifference <= candidate.amount * 0.01) {
    // Within 1%
    totalScore += config.exactAmountWeight * 0.8;
    reasons.push("Close amount match (within 1%)");
  } else if (amountDifference <= candidate.amount * 0.05) {
    // Within 5%
    totalScore += config.exactAmountWeight * 0.5;
    reasons.push("Approximate amount match (within 5%)");
  }

  // 2. Date proximity
  maxPossibleScore += config.dateProximityWeight;
  if (dateDifference <= 1) {
    totalScore += config.dateProximityWeight;
    reasons.push("Same or next day");
  } else if (dateDifference <= config.dateTolerance) {
    const proximityScore = config.dateProximityWeight * (1 - dateDifference / config.dateTolerance);
    totalScore += proximityScore;
    reasons.push(`Within ${Math.ceil(dateDifference)} days`);
  }

  // 3. Reference matching
  maxPossibleScore += config.referenceMatchWeight;
  if (transaction.reference && candidate.reference) {
    if (transaction.reference.toLowerCase() === candidate.reference.toLowerCase()) {
      totalScore += config.referenceMatchWeight;
      reasons.push("Exact reference match");
    } else if (
      transaction.reference.toLowerCase().includes(candidate.reference.toLowerCase()) ||
      candidate.reference.toLowerCase().includes(transaction.reference.toLowerCase())
    ) {
      totalScore += config.referenceMatchWeight * 0.7;
      reasons.push("Partial reference match");
    }
  } else if (
    transaction.reference &&
    (transaction.reference.toLowerCase().includes(candidate.number.toLowerCase()) ||
      candidate.number.toLowerCase().includes(transaction.reference.toLowerCase()))
  ) {
    totalScore += config.referenceMatchWeight * 0.8;
    reasons.push("Reference matches document number");
  }

  // 4. Description similarity
  maxPossibleScore += config.descriptionMatchWeight;
  if (config.enableFuzzyMatching) {
    const similarity = calculateStringSimilarity(
      transaction.description.toLowerCase(),
      candidate.description.toLowerCase(),
    );

    if (similarity >= config.descriptionSimilarityThreshold) {
      const descriptionScore = config.descriptionMatchWeight * similarity;
      totalScore += descriptionScore;
      reasons.push(`Description similarity: ${Math.round(similarity * 100)}%`);
    }
  } else {
    // Simple keyword matching
    const transactionWords = transaction.description.toLowerCase().split(/\s+/);
    const candidateWords = candidate.description.toLowerCase().split(/\s+/);
    const commonWords = transactionWords.filter(
      word => word.length > 3 && candidateWords.includes(word),
    );

    if (commonWords.length > 0) {
      const keywordScore =
        config.descriptionMatchWeight *
        (commonWords.length / Math.max(transactionWords.length, candidateWords.length));
      totalScore += keywordScore;
      reasons.push(`Common keywords: ${commonWords.join(", ")}`);
    }
  }

  // Calculate final confidence percentage
  const confidence = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  return {
    confidence: Math.round(confidence * 100) / 100,
    reasons,
    amountDifference,
    dateDifference,
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0]![i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j]![0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1, // deletion
        matrix[j - 1]![i]! + 1, // insertion
        matrix[j - 1]![i - 1]! + indicator, // substitution
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return (maxLength - matrix[str2.length]![str1.length]!) / maxLength;
}

/**
 * Generate unique transaction ID for matching
 */
function generateTransactionId(transaction: BankTransactionImport): string {
  const date = transaction.transactionDate.toISOString().split("T")[0];
  const amount = transaction.debitAmount > 0 ? transaction.debitAmount : transaction.creditAmount;
  const hash = simpleHash(`${date}_${transaction.description}_${amount}`);
  return `TXN_${hash}`;
}

/**
 * Simple hash function for generating IDs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Filter candidates by date range for performance
 */
export function filterCandidatesByDateRange(
  candidates: MatchCandidate[],
  startDate: Date,
  endDate: Date,
  bufferDays: number = 30,
): MatchCandidate[] {
  const bufferStart = new Date(startDate);
  bufferStart.setDate(bufferStart.getDate() - bufferDays);

  const bufferEnd = new Date(endDate);
  bufferEnd.setDate(bufferEnd.getDate() + bufferDays);

  return candidates.filter(
    candidate => candidate.date >= bufferStart && candidate.date <= bufferEnd,
  );
}

/**
 * Group matches by confidence level
 */
export function groupMatchesByConfidence(matches: MatchResult[]): {
  automatic: MatchResult[];
  suggested: MatchResult[];
  lowConfidence: MatchResult[];
} {
  return {
    automatic: matches.filter(m => m.confidence >= 90),
    suggested: matches.filter(m => m.confidence >= 70 && m.confidence < 90),
    lowConfidence: matches.filter(m => m.confidence < 70),
  };
}

/**
 * Validate match before applying
 */
export function validateMatch(
  transaction: BankTransactionImport,
  candidate: MatchCandidate,
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check amount direction consistency
  const transactionAmount =
    transaction.debitAmount > 0 ? transaction.debitAmount : transaction.creditAmount;
  const isTransactionOutgoing = transaction.debitAmount > 0;
  const isCandidateOutgoing = candidate.type === "PAYMENT" || candidate.type === "BILL";

  if (isTransactionOutgoing !== isCandidateOutgoing) {
    errors.push("Transaction direction does not match candidate type");
  }

  // Check amount reasonableness
  const amountDifference = Math.abs(transactionAmount - candidate.amount);
  const percentageDifference = (amountDifference / candidate.amount) * 100;

  if (percentageDifference > 10) {
    warnings.push(`Large amount difference: ${percentageDifference.toFixed(1)}%`);
  }

  // Check date reasonableness
  const dateDifference = Math.abs(
    (transaction.transactionDate.getTime() - candidate.date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dateDifference > 30) {
    warnings.push(`Large date difference: ${Math.ceil(dateDifference)} days`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
