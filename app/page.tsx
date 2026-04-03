import { HomeHeader, QueryBuilderSection } from "@/components/home/sections";

export default function Home() {
  return (
    <main className="app-shell flex-1 pb-16">
      <HomeHeader />
      <QueryBuilderSection />
    </main>
  );
}
