import PricingClientPage from './page.client';

interface PricingPageProps {
  searchParams: { status?: string };
}

export default function PricingPage({ searchParams }: PricingPageProps) {
  return <PricingClientPage searchParams={searchParams} />;
}
