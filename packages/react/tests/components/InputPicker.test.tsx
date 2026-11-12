import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { InputPicker } from "../../src/components/InputPicker";

const INPUTS = [
  { deviceId: "default", groupId: "g1", label: "Default - Loopback" },
  { deviceId: "lb", groupId: "g1", label: "Loopback (Focusrite USB Audio)" },
  { deviceId: "a1", groupId: "g2", label: "" },
];

describe("InputPicker", () => {
  it("lists the default input and the real devices, numbering unlabelled ones", () => {
    render(<InputPicker inputs={INPUTS} value="" onChange={() => {}} />);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Default input", "Loopback (Focusrite USB Audio)", "Input 2"]);
  });

  it("reports the chosen device id", () => {
    const onChange = vi.fn();
    render(<InputPicker inputs={INPUTS} value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Audio input"), { target: { value: "lb" } });
    expect(onChange).toHaveBeenCalledWith("lb");
  });

  it("renders nothing while there is nothing to choose", () => {
    const { container } = render(
      <InputPicker inputs={INPUTS.slice(0, 2)} value="" onChange={() => {}} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("stays visible when a device is selected, even if it is the only one", () => {
    render(<InputPicker inputs={INPUTS.slice(0, 2)} value="lb" onChange={() => {}} />);
    expect(screen.getByLabelText("Audio input")).toBeTruthy();
  });
});
