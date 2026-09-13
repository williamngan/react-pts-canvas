import * as React from "react";
import { createRoot } from "react-dom/client";
import { act as reactDomAct } from "react-dom/test-utils";
import { Sound } from "pts";
import { expect, it, vi } from "vitest";

import { SoundExample } from "../examples/gallery/src/PtsExamples";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const act =
  (React as unknown as { act?: typeof reactDomAct }).act ?? reactDomAct;

it("releases loaded and late-arriving sounds across file changes and unmount", async () => {
  const container = document.createElement("div");
  const style = document.createElement("style");
  style.textContent = ".sound { width: 200px; height: 120px; }";
  document.head.append(style);
  document.body.append(container);
  const root = createRoot(container);
  const first = Sound.generate("sine", 440);
  const late = Sound.generate("sine", 440);
  const disposeFirst = vi.spyOn(first, "dispose");
  const disposeLate = vi.spyOn(late, "dispose");
  let resolveLate!: (sound: Sound) => void;
  vi.spyOn(Sound, "load")
    .mockResolvedValueOnce(first)
    .mockImplementationOnce(
      () => new Promise<Sound>((resolve) => (resolveLate = resolve)),
    );
  let unmounted = false;
  try {
    await act(async () => {
      root.render(
        <SoundExample
          background="#fff"
          classPrefix="sound"
          credit="Test"
          file="first.mp3"
        />,
      );
    });
    expect(first.analyzer).toBeDefined();
    await act(async () => {
      root.render(
        <SoundExample
          background="#fff"
          classPrefix="sound"
          credit="Test"
          file="late.mp3"
        />,
      );
    });
    expect(disposeFirst).toHaveBeenCalledOnce();
    expect(first.analyzer).toBeUndefined();
    await act(async () => root.unmount());
    unmounted = true;
    await act(async () => resolveLate(late));
    expect(disposeLate).toHaveBeenCalledOnce();
  } finally {
    if (!unmounted) await act(async () => root.unmount());
    first.dispose();
    late.dispose();
    container.remove();
    style.remove();
    vi.restoreAllMocks();
  }
});
