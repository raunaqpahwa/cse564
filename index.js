import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import displayNames from "./constants.js";
import plotHistogram from "./histogram.js";

const variableList = document.querySelector(".variable-list");
const chart = document.querySelector(".chart");
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
  if (displayNames[plotKey]["isCategorical"]) {
    plotBarChart(plotKey, plotData, isHorizontal);
  } else {
    d3.select("svg").remove();
    chart.appendChild(plotHistogram(plotKey, plotData, isHorizontal));
  }
};

const initialize = async () => {
  const data = await d3.csv("data.csv", d3.autoType);
  allKeys = Object.keys(data.at(0));
  allKeys
    .map(createVariableListItems)
    .forEach((listItem) => variableList.append(listItem));

  document
    .querySelectorAll('input[name="variable"]')
    .forEach((ele) =>
      ele.addEventListener("click", (event) =>
        plotGraph(event.target.value, data)
      )
    );

  document.querySelectorAll('input[name="direction"]').forEach((ele) =>
    ele.addEventListener("click", (event) => {
      const currentVariable = document.querySelector(
        'input[name="variable"]:checked'
      );
      if (currentVariable !== null && currentVariable !== undefined) {
        plotGraph(currentVariable.value, data);
      }
    })
  );
};

initialize();
