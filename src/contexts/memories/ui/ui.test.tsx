import { afterEach, describe, expect, it, beforeEach } from "vitest";
import * as React from "react";
import { Provider } from "react-redux";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { makeStore } from "@/store";
import {
  resetContainer,
  setContainer,
  type AppContainer,
} from "@/bootstrap/container";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { SequentialIdGenerator, FixedClock } from "@/shared/ports";
import { createMemoriesModule } from "../memories.module";
import { MemoryGrid } from "./MemoryGrid";
import { AddMemoryForm } from "./AddMemoryForm";

function wire() {
  const memories = createMemoriesModule({
    store: new InMemoryKeyValueStore(),
    ids: new SequentialIdGenerator("m"),
    clock: new FixedClock(0),
  });
  setContainer({ memories } as AppContainer);
  return memories;
}

function renderWithStore(node: React.ReactElement) {
  const store = makeStore();
  return render(<Provider store={store}>{node}</Provider>);
}

beforeEach(() => wire());
afterEach(() => {
  cleanup();
  resetContainer();
});

describe("MemoryGrid", () => {
  it("shows an empty state when there are no memories", async () => {
    renderWithStore(<MemoryGrid />);
    await waitFor(() =>
      expect(screen.getByText(/no memories yet/i)).toBeInTheDocument(),
    );
  });

  it("renders memory cards with caption-derived alt text", async () => {
    const memories = wire();
    await memories.addMemory({ caption: "Beach day", media: "k1" });
    renderWithStore(<MemoryGrid />);
    await waitFor(() =>
      expect(screen.getByAltText("Beach day")).toBeInTheDocument(),
    );
  });
});

describe("AddMemoryForm", () => {
  it("labels its inputs (accessibility)", () => {
    renderWithStore(<AddMemoryForm />);
    expect(screen.getByLabelText("Caption")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Place")).toBeInTheDocument();
  });

  it("adds and removes tag chips", () => {
    renderWithStore(<AddMemoryForm />);
    const tagInput = screen.getByLabelText("Person id to tag");
    fireEvent.change(tagInput, { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("p1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove tag p1" }));
    expect(screen.queryByText("p1")).not.toBeInTheDocument();
  });

  it("submits a memory and clears the form", async () => {
    const memories = wire();
    renderWithStore(<AddMemoryForm />);
    fireEvent.change(screen.getByLabelText("Caption"), {
      target: { value: "First memory" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add memory/i }));
    await waitFor(async () => {
      const all = await memories.listMemoriesFor();
      expect(all.map((m) => m.caption)).toContain("First memory");
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Caption")).toHaveValue(""),
    );
  });

  it("blocks submission without a caption", () => {
    renderWithStore(<AddMemoryForm />);
    // Submit the form directly to exercise the guard (bypasses native `required`).
    fireEvent.submit(screen.getByRole("form", { name: /add a memory/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/caption/i);
  });
});
