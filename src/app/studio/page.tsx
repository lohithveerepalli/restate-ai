import { StudioShell } from "@/components/studio/studio-shell";

export const metadata = {
  title: "Studio · Restate.ai",
  description: "Land Development Studio — select land and generate with AI.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string; guest?: string; surprise?: string }>;
}) {
  const params = await searchParams;
  const startTour = params.tour === "1" || params.tour === "true";
  const autoSurprise =
    params.surprise === "1" || params.surprise === "true";

  return (
    <StudioShell startTour={startTour && !autoSurprise} autoSurprise={autoSurprise} />
  );
}
