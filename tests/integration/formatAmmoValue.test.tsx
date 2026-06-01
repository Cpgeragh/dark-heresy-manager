// tests/integration/formatAmmoValue.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { formatAmmoValue } from "../../src/pages/characterSheet/weapons/AmmoCard";

describe("formatAmmoValue", () => {
  it("renders split format with throne, times, and quantity spans", () => {
    render(<>{formatAmmoValue("30 / 10")}</>);

    expect(screen.getByText(/₮ 30/)).toBeInTheDocument();
    expect(screen.getByText("×")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders plain format with a single throne span and no times symbol", () => {
    render(<>{formatAmmoValue("15 Thrones")}</>);

    expect(screen.getByText(/₮ 15 Thrones/)).toBeInTheDocument();
    expect(screen.queryByText("×")).not.toBeInTheDocument();
  });
});
