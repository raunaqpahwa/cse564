import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import displayNames from "./constants.js";
import plotHistogram from "./histogram.js";
import plotBarChart from "./barChart.js";
import plotScatterPlot from "./scatterPlot.js";

const variableList = document.querySelector(".variable-list");
const chart = document.querySelector(".chart");
const scatter = document.querySelector('input[name="scatter-plot"]');
const scatterX = document.querySelector(".scatter-x-variable");
const scatterY = document.querySelector(".scatter-y-variable");
const dialogClose = document.querySelector(".dialog-close");
const directoryPane = document.querySelector(".variable-directory");
const directoryButton = document.querySelector(".directory-button");

directoryButton.addEventListener("click", (event) => {
  directoryPane.style.display = "flex";
  document.body.classList.toggle("hide-overflow");
});

dialogClose.addEventListener("click", () => {
  directoryPane.style.display = "none";
  document.body.classList.toggle("hide-overflow");
});

scatter.addEventListener("click", (event) => {
  if (!event.target.checked) {
    scatterX.dataset.value = "";
    scatterX.textContent = "";
    scatterY.dataset.value = "";
    scatterY.textContent = "";
    const selectedVar = document.querySelector(
      'input[name="variable"]:checked'
    );
    if (selectedVar) {
      selectedVar.checked = false;
    }
  }
});
let allKeys = null;

const createVariableListItems = (key) => {
  const listElement = document.createElement("li");
  const label = document.createElement("label");
  const inputElement = document.createElement("input");
  inputElement.type = "radio";
  inputElement.name = "variable";
  inputElement.value = `${key}`;
  const keyText = document.createTextNode(
    `\u00A0${displayNames[key]["displayName"]}`
  );
  label.append(inputElement, keyText);
  listElement.appendChild(label);
  return listElement;
};

const plotGraph = (plotKey, plotData) => {
  const direction = document.querySelector('input[name="direction"]:checked');
  const isHorizontal = direction.value === "horizontal";

  if (scatter.checked) {
    if (scatterX.dataset.value !== "" && scatterY.dataset.value !== "") {
      d3.select("svg").remove();
      chart.appendChild(
        plotScatterPlot(
          scatterX.dataset.value,
          scatterY.dataset.value,
          plotData
        )
      );
    }
  } else {
    d3.select("svg").remove();
    if (displayNames[plotKey]["isCategorical"]) {
      chart.appendChild(plotBarChart(plotKey, plotData, isHorizontal));
    } else {
      chart.appendChild(plotHistogram(plotKey, plotData, isHorizontal));
    }
  }
};

const initialize = async () => {
  const data = await d3.csv("data.csv", d3.autoType);
  allKeys = Object.keys(data.at(0));
  allKeys
    .map(createVariableListItems)
    .forEach((listItem) => variableList.append(listItem));

  document.querySelectorAll('input[name="variable"]').forEach((ele) =>
    ele.addEventListener("click", (event) => {
      if (scatter.checked) {
        const selected = document.querySelector('input[name="axes"]:checked');
        if (selected) {
          if (selected.value === "x") {
            scatterX.dataset.value = event.target.value;
            scatterX.textContent =
              displayNames[event.target.value]["displayName"];
          } else if (selected.value === "y") {
            scatterY.dataset.value = event.target.value;
            scatterY.textContent =
              displayNames[event.target.value]["displayName"];
          }
        }
      }
      plotGraph(event.target.value, data);
    })
  );

  document.querySelectorAll('input[name="direction"]').forEach((ele) =>
    ele.addEventListener("click", (event) => {
      const currentVariable = document.querySelector(
        'input[name="variable"]:checked'
      );
      if (scatter.checked) {
        let temp = scatterX.dataset.value;
        scatterX.dataset.value = scatterY.dataset.value;
        scatterY.dataset.value = temp;
        temp = scatterX.textContent;
        scatterX.textContent = scatterY.textContent;
        scatterY.textContent = temp;
      }
      if (currentVariable !== null && currentVariable !== undefined) {
        plotGraph(currentVariable.value, data);
      }
    })
  );
};

initialize();
