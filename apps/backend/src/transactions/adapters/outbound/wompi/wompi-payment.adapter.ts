import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  PaymentGatewayPort,
  PaymentRequest,
  PaymentResponse,
} from '../../../domain/ports/outbound/payment-gateway.port';
import { WompiTransactionRequest, WompiTransactionResponse } from './wompi.types';

@Injectable()
export class WompiPaymentAdapter implements PaymentGatewayPort {
  private readonly apiUrl: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WOMPI_API_URL');
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');
    this.integrityKey = this.configService.get<string>('WOMPI_INTEGRITY_KEY');
  }

  private generateSignature(reference: string, amountInCents: number, currency: string): string {
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
      console.error('WOMPI API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        request: body,
      });
      throw new Error(`WOMPI payment failed: ${response.status} ${errorBody}`);
    }

    const result: WompiTransactionResponse = await response.json();

    return {
      transactionId: result.data.id,
      status: result.data.status,
    };
  }
}
