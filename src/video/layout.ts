export type Format = "vertical" | "horizontal";
export function sceneLayout(format: Format) {
  const vertical = format === "vertical";
  return {
    width: vertical ? 1080 : 1920,
    height: vertical ? 1920 : 1080,
    margin: 96,
    captionWidth: vertical ? 840 : 1344,
    captionTop: vertical ? 1510 : 800,
    nodeWidth: vertical ? 760 : 500,
    nodeHeight: vertical ? 210 : 250,
    nodes: vertical
      ? [
          { x: 160, y: 480 },
          { x: 160, y: 820 },
          { x: 160, y: 1160 },
        ]
      : [
          { x: 110, y: 390 },
          { x: 710, y: 390 },
          { x: 1310, y: 390 },
        ],
  };
}
