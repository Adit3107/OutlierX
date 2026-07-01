import fs from 'fs';
import { parse } from 'csv-parse';
import { Prisma } from '@prisma/client';
import { SUPPORTED_CURRENCIES, UploadRowError } from '@anomaly/shared';
import { TransactionRepository } from '../repositories/transaction.repository.js';

const REQUIRED_COLUMNS = ['transaction_id', 'timestamp', 'amount', 'currency', 'merchant'] as const;
const OPTIONAL_COLUMNS = [
  'merchant_category',
  'account_number',
  'country',
  'city',
  'payment_method',
  'description',
  'reference_number',
  'customer_id',
] as const;
const ERROR_LIMIT = 200;
const BATCH_SIZE = 500;

type CsvRow = Record<string, string | undefined>;

export interface ParseSummary {
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: UploadRowError[];
}

function cleanText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeCurrency(value: string | undefined): string | null {
  return cleanText(value)?.toUpperCase() ?? null;
}

export class CsvValidationService {
  validateRow(
    row: CsvRow,
    rowNumber: number,
    context: { organizationId: string; uploadId: string }
  ): { transaction?: Prisma.TransactionCreateManyInput; error?: UploadRowError } {
    const errors: string[] = [];

    const transactionId = cleanText(row.transaction_id);
    const merchant = cleanText(row.merchant);
    const currency = normalizeCurrency(row.currency);
    const amountValue = cleanText(row.amount);
    const timestampValue = cleanText(row.timestamp);

    for (const column of REQUIRED_COLUMNS) {
      if (!cleanText(row[column])) {
        errors.push(`Missing required column value: ${column}`);
      }
    }

    const amount = amountValue ? Number(amountValue) : NaN;
    if (!Number.isFinite(amount)) {
      errors.push('Invalid amount');
    } else if (amount < 0) {
      errors.push('Negative amounts are not supported');
    }

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number])) {
      errors.push('Invalid currency');
    }

    const timestamp = timestampValue ? new Date(timestampValue) : null;
    if (!timestamp || Number.isNaN(timestamp.getTime())) {
      errors.push('Invalid timestamp');
    }

    if (errors.length > 0 || !transactionId || !merchant || !currency || !timestamp) {
      return {
        error: {
          row: rowNumber,
          transactionId,
          errors,
        },
      };
    }

    return {
      transaction: {
        organizationId: context.organizationId,
        uploadId: context.uploadId,
        transactionId,
        timestamp,
        amount: amount.toFixed(2),
        currency,
        merchant,
        merchantCategory: cleanText(row.merchant_category),
        accountNumber: cleanText(row.account_number),
        country: cleanText(row.country),
        city: cleanText(row.city),
        paymentMethod: cleanText(row.payment_method),
        description: cleanText(row.description),
        referenceNumber: cleanText(row.reference_number),
        customerId: cleanText(row.customer_id),
        status: 'IMPORTED',
        metadata: {
          sourceRow: rowNumber,
        },
      },
    };
  }
}

export class TransactionPersistenceService {
  constructor(private transactionRepository: TransactionRepository) {}

  insertBatch(transactions: Prisma.TransactionCreateManyInput[]) {
    return this.transactionRepository.createMany(transactions);
  }
}

export class CsvParserService {
  constructor(
    private validationService: CsvValidationService,
    private persistenceService: TransactionPersistenceService
  ) {}

  async parseFile(input: {
    filePath: string;
    organizationId: string;
    uploadId: string;
  }): Promise<ParseSummary> {
    const summary: ParseSummary = {
      totalRows: 0,
      processedRows: 0,
      failedRows: 0,
      errors: [],
    };
    let batch: Prisma.TransactionCreateManyInput[] = [];
    let headersChecked = false;

    const flushBatch = async () => {
      if (batch.length === 0) {
        return;
      }

      const currentBatch = batch;
      batch = [];
      await this.persistenceService.insertBatch(currentBatch);
      summary.processedRows += currentBatch.length;
    };

    const parser = fs.createReadStream(input.filePath).pipe(
      parse({
        bom: true,
        columns: (headers: string[]) =>
          headers.map((header) => header.trim().toLowerCase().replace(/\s+/g, '_')),
        skip_empty_lines: true,
        trim: false,
      })
    );

    for await (const row of parser as AsyncIterable<CsvRow>) {
      summary.totalRows += 1;

      if (!headersChecked) {
        headersChecked = true;
        const headerNames = new Set(Object.keys(row));
        const missingHeaders = REQUIRED_COLUMNS.filter((column) => !headerNames.has(column));
        const knownColumns = new Set<string>([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]);

        if (missingHeaders.length > 0) {
          throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}`);
        }

        Object.keys(row).forEach((column) => {
          if (!knownColumns.has(column)) {
            row[column] = cleanText(row[column]) ?? undefined;
          }
        });
      }

      const rowNumber = summary.totalRows + 1;
      const result = this.validationService.validateRow(row, rowNumber, {
        organizationId: input.organizationId,
        uploadId: input.uploadId,
      });

      if (result.error) {
        summary.failedRows += 1;
        if (summary.errors.length < ERROR_LIMIT) {
          summary.errors.push(result.error);
        }
        continue;
      }

      if (result.transaction) {
        batch.push(result.transaction);
      }

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    }

    await flushBatch();
    return summary;
  }
}
