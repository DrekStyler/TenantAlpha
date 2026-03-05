import { Spinner } from "@/components/ui/Spinner";

export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50">
      <Spinner size="lg" />
    </div>
  );
}
