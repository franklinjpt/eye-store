import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  PaymentGatewayPort,
  PaymentRequest,
  PaymentResponse,
} from '../../../domain/ports/outbound/payment-gateway.port';
import {
  WompiTransactionRequest,
  WompiTransactionResponse,
  WompiGetTransactionResponse,
} from './wompi.types';

@Injectable()
export class WompiPaymentAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(WompiPaymentAdapter.name);
  private readonly apiUrl: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('WOMPI_API_URL');
    this.privateKey = this.configService.getOrThrow<string>('WOMPI_PRIVATE_KEY');
    this.integrityKey =
      this.configService.getOrThrow<string>('WOMPI_INTEGRITY_KEY');
  }

  private generateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    // Wompi signature format: reference + amountInCents + currency + integrityKey
    const concatenated = `${reference}${amountInCents}${currency}${this.integrityKey}`;
    return createHash('sha256').update(concatenated).digest('hex');
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const signature = this.generateSignature(
      request.reference,
      request.amountInCents,
      request.currency,
    );

    const body: WompiTransactionRequest = {
      amount_in_cents: request.amountInCents,
      currency: request.currency,
      reference: request.reference,
      customer_email: request.customerEmail,
      payment_method: {
        type: 'CARD',
        token: request.paymentMethodToken,
        installments: request.installments,
      },
      acceptance_token: request.acceptanceToken,
      signature,
    };

    this.logger.log(
      `[createPayment] Sending to Wompi — reference: ${request.reference}, amount: ${request.amountInCents} ${request.currency}`,
    );

    const response = await fetch(`${this.apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.privateKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `[createPayment] Wompi API error — status: ${response.status}, body: ${errorBody}`,
      );
      throw new Error(`WOMPI payment failed: ${response.status} ${errorBody}`);
    }

    const result: WompiTransactionResponse = await response.json();

    this.logger.log(
      `[createPayment] Wompi response — wompiTransactionId: ${result.data.id}, status: ${result.data.status}`,
    );

    return {
      transactionId: result.data.id,
      status: result.data.status,
    };
  }

  // Fetches the live status of an existing Wompi transaction.
  // Called during polling when our DB still shows PENDING.
  async getTransactionStatus(wompiTransactionId: string): Promise<string> {
    this.logger.log(
      `[getTransactionStatus] Fetching live status from Wompi for wompiTransactionId: ${wompiTransactionId}`,
    );

    const response = await fetch(
      `${this.apiUrl}/transactions/${wompiTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `[getTransactionStatus] Wompi API error — status: ${response.status}, body: ${errorBody}`,
      );
      throw new Error(
        `Failed to fetch Wompi transaction status: ${response.status}`,
      );
    }

    const result: WompiGetTransactionResponse = await response.json();
    const { status } = result.data;

    this.logger.log(
      `[getTransactionStatus] Wompi live status for ${wompiTransactionId}: ${status}`,
    );

    // Log full details when the transaction is not successful so we can diagnose the cause
    if (status === 'ERROR' || status === 'DECLINED') {
      this.logger.warn(
        `[getTransactionStatus] Non-successful status "${status}" — full Wompi response:\n${JSON.stringify(result.data, null, 2)}`,
      );
    }

    return status;
  }
}
