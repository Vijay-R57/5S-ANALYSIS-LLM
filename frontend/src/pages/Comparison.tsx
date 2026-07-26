/**
 * src/pages/Comparison.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point for the /5s-comparison route.
 * Re-exports the ComparisonPage from the comparison module with shared Navbar/Footer.
 * App.tsx routing is unchanged.
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ComparisonPage from "@/modules/comparison/pages/ComparisonPage";

const Comparison = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <ComparisonPage />
      <Footer />
    </div>
  );
};

export default Comparison;

