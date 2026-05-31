"use client";

import * as React from "react";
import { createChart, type Chart, type TreeDatum } from "family-chart";
import "family-chart/styles/family-chart.css";
import type { TreeDTO } from "../../application/dtos";
import { cn } from "@/shared/ui";
import { toFamilyChartData, type FamilyChartDatum } from "./family-chart-adapter";

export interface FamilyChartTreeProps {
  tree: TreeDTO;
  /** Person the tree is centered on (the f3 "main" node). */
  focalId: string;
  /** Fired when a card is clicked — integrator re-roots the tree. */
  onReroot?: (personId: string) => void;
  /** Fired when a card's profile action is used. */
  onOpenProfile?: (personId: string) => void;
  className?: string;
}

const CARD_DIM = { w: 116, h: 104, text_x: 0, text_y: 0, img_w: 36, img_h: 36, img_x: 0, img_y: 0 };

/** On GitHub Pages the app is served from a sub-path; static assets must carry
 * that prefix (Next only rewrites it for next/image and <Link>, not raw URLs). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Illustrated avatars (already circular) used when a person has no photo. */
const MALE_AVATAR_SRC = `${BASE_PATH}/avatars/male-icon.png`;
const FEMALE_AVATAR_SRC = `${BASE_PATH}/avatars/female-icon.png`;

/**
 * Custom leaf-shaped card: avatar / name / birth year / location, stacked
 * vertically. Border colour follows gender (blue = M, pink = F); a dashed
 * border marks a married-in spouse (f3 flags these with `added`).
 */
function cardInnerHtml(d: TreeDatum): string {
  const data = (d.data as FamilyChartDatum).data;
  const gender = d.data.data.gender === "F" ? "f" : "m";
  const marriedIn = d.added === true;
  const photo =
    data.avatar ?? (gender === "f" ? FEMALE_AVATAR_SRC : MALE_AVATAR_SRC);
  const avatar = `<span class="fct-avatar" style="background-image:url('${photo}')"></span>`;
  const cross = data.deceased ? `<span class="fct-cross" aria-hidden="true"> ✝</span>` : "";
  const birth = data.years
    ? `<div class="fct-sub">${escapeHtml(data.years)}</div>`
    : "";
  const place = data.location
    ? `<div class="fct-place">${escapeHtml(data.location)}</div>`
    : "";
  const cls = `fct-card fct-card--${gender}${marriedIn ? " fct-card--married" : ""}`;
  return `
    <div class="${cls}">
      ${avatar}
      <div class="fct-name">${escapeHtml(data.name)}${cross}</div>
      ${birth}
      ${place}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Family tree rendered with the `family-chart` (f3) D3 engine. f3 is imperative
 * — it mounts into a raw DOM container — so we drive it from effects against a
 * ref and keep React out of the SVG it owns. The {@link toFamilyChartData}
 * adapter converts our edge-based {@link TreeDTO} into f3's flat format.
 */
export function FamilyChartTree({
  tree,
  focalId,
  onReroot,
  onOpenProfile,
  className,
}: FamilyChartTreeProps): React.JSX.Element {
  const contRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  // Keep latest callbacks without re-creating the chart on every render.
  const cbRef = React.useRef({ onReroot, onOpenProfile });
  cbRef.current = { onReroot, onOpenProfile };

  const data = React.useMemo(() => toFamilyChartData(tree), [tree]);

  // Create the chart once, on mount.
  React.useEffect(() => {
    const cont = contRef.current;
    if (!cont) return;

    const chart = createChart(cont, data as never);
    chartRef.current = chart;

    chart
      .setCardHtml()
      .setCardDim(CARD_DIM)
      .setMiniTree(true)
      .setCardInnerHtmlCreator(cardInnerHtml)
      .setOnCardClick((_e: MouseEvent, d: TreeDatum) => {
        cbRef.current.onReroot?.(d.data.id);
      });

    // A hollow heart sits over the link between each married couple.
    chart.setLinkSpouseText(() => "♡");
    chart.setCardXSpacing(140).setCardYSpacing(150);

    chart.updateMainId(focalId);
    chart.updateTree({ initial: true, tree_position: "fit" });

    // Re-fit the tree whenever the container resizes (window resize, sidebar
    // toggles, orientation changes). Debounced to one call per frame.
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        chartRef.current?.updateTree({ tree_position: "fit", initial: false });
      });
    });
    ro.observe(cont);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      chartRef.current = null;
      cont.innerHTML = "";
    };
    // Mount-only: data/focal updates are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-feed data when the tree changes.
  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.updateData(data as never);
    chart.updateTree({ tree_position: "inherit" });
  }, [data]);

  // Re-center when the focal person changes.
  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.updateMainId(focalId);
    chart.updateTree({ tree_position: "main_to_middle" });
  }, [focalId]);

  return (
    <div
      ref={contRef}
      className={cn(
        // Full-bleed: break out of the centered page container to span the
        // viewport, and fill the height below the header. Height is
        // viewport-relative so it reflows on window resize.
        "f3 fct-cont relative left-1/2 right-1/2 -mx-[50vw] w-screen",
        "h-[calc(100vh-180px)] min-h-[460px] overflow-hidden border-y border-border bg-background",
        className,
      )}
      aria-label="Family tree"
    />
  );
}
