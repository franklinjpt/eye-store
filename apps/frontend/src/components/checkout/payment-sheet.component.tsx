import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PaymentFlowContent } from './payment-flow-content.component';
import { useAppDispatch } from '@/store';
import { resetCheckout } from '@/store/slices/checkout.slice';

export function PaymentSheet() {
  const dispatch = useAppDispatch();

  function handleClose() {
    dispatch(resetCheckout());
  }

  return (
    <BottomSheet isOpen onClose={handleClose}>
      <PaymentFlowContent onClose={handleClose} />
    </BottomSheet>
  );
}
