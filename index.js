import screePlot from "./screePlot.js";
import clusterPlot from "./clusterPlot.js";
import biPlot from "./biPlot.js";
import pcTable from "./pcTable.js";

const initialise = async () => {
  screePlot();
  clusterPlot();
  biPlot(null, null, null, null);
};

initialise();
