import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { CreditCardForm, type CreditCardData } from './credit-card-form.component';
import { DeliveryForm } from './delivery-form.component';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCardToken, setDeliveryInfo, goToSummary, resetCheckout } from '@/store/slices/checkout.slice';
import { tokenizeCard, getAcceptanceToken } from '@/services/wompi.service';
import type { DeliveryInfo } from '@/types';

type ModalStep = 'card' | 'delivery';

export function PaymentModal() {
  const dispatch = useAppDispatch();
  const deliveryInfo = useAppSelector((s) => s.checkout.deliveryInfo);
  const [modalStep, setModalStep] = useState<ModalStep>('card');
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
      setModalStep('delivery');
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

  function handleClose() {
    dispatch(resetCheckout());
  }

  function handleBackToCard() {
    setModalStep('card');
  }

  return (
    <Modal isOpen onClose={handleClose}>
      {modalStep === 'card' && (
        <div className='flex flex-col gap-3'>
          <CreditCardForm
            onSubmit={handleCardSubmit}
            onBack={handleClose}
            isLoading={isTokenizing}
          />
          {tokenError && (
            <p className='text-center text-sm text-rose-400'>{tokenError}</p>
          )}
        </div>
      )}
      {modalStep === 'delivery' && (
        <DeliveryForm
          onSubmit={handleDeliverySubmit}
          onBack={handleBackToCard}
          initialValues={deliveryInfo}
        />
      )}
    </Modal>
  );
}
