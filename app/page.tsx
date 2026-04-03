import {
  formatOptions,
  previewUrl,
  queryClauses,
  sampleDeadlines,
} from "@/components/home/data";
import {
  DeadlinesPreviewSection,
  ExportPreviewSection,
  HeroSection,
  HomeHeader,
  QueryBuilderSection,
} from "@/components/home/sections";

export default function Home() {
  return (
    <main className="app-shell flex-1 pb-16">
      <HomeHeader />
      <HeroSection />
      <QueryBuilderSection clauses={queryClauses} />
      <ExportPreviewSection options={formatOptions} url={previewUrl} />
      <DeadlinesPreviewSection deadlines={sampleDeadlines} />
    </main>
  );
}
