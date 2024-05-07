import barChart from "./barChart.js";
import renderMap from "./map.js";
import treeMap from "./treeMap.js";

const initialise = () => {
  barChart();
  treeMap();
  renderMap();

  document.querySelector("#bar-reset").addEventListener("click", () => {
    barChart();
  });
};

initialise();
