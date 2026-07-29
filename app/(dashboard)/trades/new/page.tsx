import { TradeForm } from "@/components/trades/TradeForm";

export default function NewTradePage() {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">
        Add Trade
      </h1>

      <TradeForm />
    </>
  );
}