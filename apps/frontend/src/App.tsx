import { CatalogView } from '@/components/catalog/catalog-view.component';
import { PaymentModal } from '@/components/checkout/payment-modal.component';
import { SummaryBackdrop } from '@/components/checkout/summary-backdrop.component';
import { TransactionResultView } from '@/components/checkout/transaction-result.component';
import { useAppSelector } from '@/store';

export function App() {
  const currentStep = useAppSelector((s) => s.checkout.currentStep);

  return (
    <>
      <CatalogView />
      {currentStep === 'payment' && <PaymentModal />}
      {currentStep === 'summary' && <SummaryBackdrop />}
      {currentStep === 'result' && <TransactionResultView />}
    </>
  );
}
