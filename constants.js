const metadata = {
  Manhattan: { displayName: "Manhattan" },
  Brooklyn: { displayName: "Brooklyn" },
  Queens: { displayName: "Queens" },
  Bronx: { displayName: "Bronx" },
  StatenIsland: { displayName: "Staten Island" },
};

const colors = {
  1: "#4DA6FF",
  2: "#4CAF50",
  3: "#FFEB3B",
  4: "#FF8A80",
  5: "#FFB74D",
  6: "#9C27B0",
  7: "#64B5F6",
  8: "#EF5350",
  9: "#26C6DA",
  10: "#9575CD",
};

const boroughColors = {
  Manhattan: "#7ebdc7",
  Brooklyn: "#a4d6a5",
  Queens: "#f29991",
  StatenIsland: "#f5ba89",
  "Staten Island": "#f5ba89",
  Bronx: "#b6a0d3",
};

const selectedBoroughColors = {
  Manhattan: "#aed9e0",
  Brooklyn: "#c7e5c2",
  Queens: "#f5b7b1",
  StatenIsland: "#f9d8b8",
  "Staten Island": "#f9d8b8",
  Bronx: "#d8c9e6",
};

const strokeColors = {
  Manhattan: "#22676e",
  Brooklyn: "#2c6c2a", // Very dark shade of green
  Queens: "#9c2d25", // Very dark shade of red
  StatenIsland: "#a05e28", // Very dark shade of orange
  "Staten Island": "#a05e28", // Very dark shade of orange (for consistency)
  Bronx: "#4d3c6e",
};

export { metadata, colors, strokeColors, boroughColors, selectedBoroughColors };
