import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QualityScore } from "@/components/dashboard/quality-score";
import { AIAnalysisPanel } from "@/components/requirements/ai-analysis-panel";

describe("QualityScore", () => {
  it("renders score correctly", () => {
    render(<QualityScore score={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("shows correct label for high score", () => {
    render(<QualityScore score={95} />);
    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  it("shows correct label for low score", () => {
    render(<QualityScore score={30} />);
    expect(screen.getByText("Needs Improvement")).toBeInTheDocument();
  });
});

describe("AIAnalysisPanel", () => {
  it("renders analyze button", () => {
    render(
      <AIAnalysisPanel
        requirementId="test-id"
        title="Test Requirement"
      />
    );
    expect(screen.getByText("Analyze")).toBeInTheDocument();
  });
});
