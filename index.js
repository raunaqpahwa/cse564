import clusterPlot from "./clusterPlot.js";
import mdsPlot from "./mdsPlot.js";
import pcpPlot from "./pcpPlot.js";

const initialise = async () => {
  clusterPlot();
  mdsPlot(null, null);
  pcpPlot(null, null);

  const radios = document.querySelectorAll('input[name="mds-select"]');
  radios.forEach((radio) =>
    radio.addEventListener("change", (e) => {
      mdsPlot(null, e.target.value);
    })
  );
};

initialise();
