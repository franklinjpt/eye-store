const WOMPI_URL = import.meta.env.VITE_WOMPI_API_URL;
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY;

type CardData = {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
};

type TokenizeResponse = {
  data: {
    id: string;
  };
};

export async function tokenizeCard(card: CardData): Promise<string> {
  const response = await fetch(`${WOMPI_URL}/tokens/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WOMPI_PUBLIC_KEY}`,
    },
    body: JSON.stringify({
      number: card.number,
      exp_month: card.expMonth,
      exp_year: card.expYear,
      cvc: card.cvc,
      card_holder: card.cardHolder,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to tokenize card: ${response.status}`);
  }

  const result: TokenizeResponse = await response.json();
  return result.data.id;
}

type MerchantResponse = {
  data: {
    presigned_acceptance: {
      acceptance_token: string;
    };
  };
};

export async function getAcceptanceToken(): Promise<string> {
  const response = await fetch(`${WOMPI_URL}/merchants/${WOMPI_PUBLIC_KEY}`);

  if (!response.ok) {
    throw new Error('Failed to get acceptance token');
  }

  const result: MerchantResponse = await response.json();
  return result.data.presigned_acceptance.acceptance_token;
}
