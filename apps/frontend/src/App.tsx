import { CatalogView } from '@/components/catalog/catalog-view.component';
import { PaymentModal } from '@/components/checkout/payment-modal.component';
import { PaymentSheet } from '@/components/checkout/payment-sheet.component';
import { SummaryBackdrop } from '@/components/checkout/summary-backdrop.component';
import { TransactionResultView } from '@/components/checkout/transaction-result.component';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useAppSelector } from '@/store';

export function App() {
  const currentStep = useAppSelector((s) => s.checkout.currentStep);
  const isMobile = useIsMobile();

  return (
    <>
      <CatalogView />
      {currentStep === 'payment' && (isMobile ? <PaymentSheet /> : <PaymentModal />)}
      {currentStep === 'summary' && <SummaryBackdrop />}
      {currentStep === 'result' && <TransactionResultView />}
    </>
  );
}
