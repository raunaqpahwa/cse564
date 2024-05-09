import barChart from "./barChart.js";
import renderMap from "./map.js";
import treeMap from "./treeMap.js";
import renderPie from "./pie.js";
import plotRadarPlot from "./radarPlot.js";

const initialise = () => {
  barChart();
  treeMap();
  renderMap();
  renderPie();
  plotRadarPlot(null, false);
};

initialise();
