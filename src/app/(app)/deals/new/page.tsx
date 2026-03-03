import { DealSetupForm } from "@/components/deals/DealSetupForm";

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">New Analysis</h1>
        <p className="text-sm text-navy-500">Set up your lease comparison</p>
      </div>
      <DealSetupForm />
    </div>
  );
}
