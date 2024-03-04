import { metadata } from "./constants.js";
import scatterMatrix from "./scatterMatrix.js";

let globalK = 4,
  globalDi = 5;

const pcTable = async (di, k) => {
  if (di === null) {
    di = globalDi;
  } else {
    globalDi = di;
  }

  if (k === null) {
    k = globalK;
  } else {
    globalK = k;
  }

  const pcTableData = await axios.get("http://localhost:8000/pctable", {
    params: {
      di,
    },
  });

  const features = pcTableData.data;
  const div = document.querySelector(".pc-table");
  div.innerHTML = "";

  document.documentElement.style.setProperty(
    "--pc-table-cols",
    (di + 2).toString()
  );

  const attribute = document.createElement("div");
  attribute.textContent = "Attribute";
  attribute.style.cssText = "font-weight: bold;";
  div.append(attribute);
  for (let i = 0; i < di; i++) {
    const pc = document.createElement("div");
    pc.textContent = `PC ${i + 1}`;
    pc.style.cssText = "font-weight: bold;";
    div.append(pc);
  }
  const sum = document.createElement("div");
  sum.textContent = "Squared Sum Loadings";
  sum.style.cssText = "font-weight: bold;";
  div.append(sum);

  for (let feature of features) {
    const featureName = feature["name"];
    const featureNameDiv = document.createElement("div");
    featureNameDiv.textContent = metadata[featureName]["displayName"];
    div.append(featureNameDiv);
    for (let i = 0; i < feature["loadings"].length; i++) {
      const loadingValue = feature["loadings"][i].toFixed(6);
      const loadingValueDiv = document.createElement("div");
      loadingValueDiv.textContent = loadingValue;
      div.append(loadingValueDiv);
    }
    const sumValue = feature["loadingSum"].toFixed(6);
    const sumValueDiv = document.createElement("div");
    sumValueDiv.textContent = sumValue;
    div.append(sumValueDiv);
  }

  scatterMatrix(di, k);
};

export default pcTable;
