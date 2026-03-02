import { useState } from 'react';
import { CreditCardForm, type CreditCardData } from './credit-card-form.component';
import { DeliveryForm } from './delivery-form.component';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCardToken, setDeliveryInfo, goToSummary } from '@/store/slices/checkout.slice';
import { tokenizeCard, getAcceptanceToken } from '@/services/wompi.service';
import type { DeliveryInfo } from '@/types';

type PaymentFlowStep = 'card' | 'delivery';

export type PaymentFlowContentProps = {
  onClose: () => void;
};

export function PaymentFlowContent({ onClose }: PaymentFlowContentProps) {
  const dispatch = useAppDispatch();
  const deliveryInfo = useAppSelector((s) => s.checkout.deliveryInfo);
  const [step, setStep] = useState<PaymentFlowStep>('card');
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  async function handleCardSubmit(data: CreditCardData) {
    setIsTokenizing(true);
    setTokenError(null);

    try {
      const [month, year] = data.expiry.split('/');
      const [tokenId, acceptanceToken] = await Promise.all([
        tokenizeCard({
          number: data.cardNumber,
          expMonth: month,
          expYear: year,
          cvc: data.cvv,
          cardHolder: data.cardholderName,
        }),
        getAcceptanceToken(),
      ]);

      dispatch(setCardToken({ tokenId, acceptanceToken }));
      setStep('delivery');
    } catch {
      setTokenError('Failed to process card. Please check your details and try again.');
    } finally {
      setIsTokenizing(false);
    }
  }

  function handleDeliverySubmit(info: DeliveryInfo) {
    dispatch(setDeliveryInfo(info));
    dispatch(goToSummary());
  }

  return (
    <>
      {step === 'card' && (
        <div className='flex flex-col gap-3'>
          <CreditCardForm
            onSubmit={handleCardSubmit}
            onBack={onClose}
            isLoading={isTokenizing}
          />
          {tokenError && (
            <p className='px-2 pb-2 text-center text-sm text-rose-400 sm:px-0 sm:pb-0'>
              {tokenError}
            </p>
          )}
        </div>
      )}
      {step === 'delivery' && (
        <DeliveryForm
          onSubmit={handleDeliverySubmit}
          onBack={() => setStep('card')}
          initialValues={deliveryInfo}
        />
      )}
    </>
  );
}
