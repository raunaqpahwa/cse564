import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {
  metadata,
  darkerVariableColors,
  colors,
  greenSwatch,
  redSwatch,
} from "./constants.js";
import pcpPlot from "./pcpPlot.js";

const createDataMdsTooltip = (k) => {
  return `<ul style="list-style-type: none;">
            ${Object.keys(colors)
              .map((color, i) =>
                i + 1 <= k
                  ? `<li style="display: flex; align-items: center;">
                  <div style="width: 15px; height: 5px; background-color: ${
                    colors[color]
                  }; display: inline-block; margin-right: 5px; border-radius: 2px;">
                  </div> Cluster ${i + 1} 
            
          </li>`
                  : null
              )
              .filter((val) => val !== null)
              .join("")}
    </ul>`;
};

let globalK = 4,
  globalType = "variables",
  order = [];

const mdsPlot = async (k, type) => {
  if (k === null) {
    k = globalK;
  } else {
    globalK = k;
  }
  if (type === null) {
    type = globalType;
  } else {
    globalType = type;
  }

  const svg = d3.select("#mds-svg");
  svg.selectAll("*").remove();
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const margin = 50;
  let xScale = null,
    yScale = null;

  if (type === "data") {
    const dataMds = await axios.get("http://localhost:8000/data_mds", {
      params: { k },
    });

    const mds = dataMds.data;

    const minValues = mds.reduce(
      (acc, val) => ({
        ...acc,
        x: Math.min(acc.x, val.x),
        y: Math.min(val.y, acc.y),
      }),
      {
        x: Number.MAX_VALUE,
        y: Number.MAX_VALUE,
      }
    );

    const maxValues = mds.reduce(
      (acc, val) => ({
        ...acc,
        x: Math.max(acc.x, val.x),
        y: Math.max(val.y, acc.y),
      }),
      {
        x: Number.MIN_VALUE,
        y: Number.MIN_VALUE,
      }
    );

    xScale = d3
      .scaleLinear()
      .domain([minValues.x - 0.2, maxValues.x + 0.2])
      .range([margin, width - margin]);

    yScale = d3
      .scaleLinear()
      .domain([minValues.y - 0.2, maxValues.y + 0.2])
      .range([height - margin, margin]);

    // line
    svg
      .selectAll(".circle")
      .data(mds)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4)
      .attr("fill", (d) => colors[d.cluster]);

    // legend
    svg
      .append("foreignObject")
      .attr("width", 500)
      .attr("height", 500)
      .attr("x", width + margin - 150)
      .attr("y", margin - 20)
      .append("xhtml:body")
      .html(createDataMdsTooltip(k));
  } else {
    const featureMds = await axios.get("http://localhost:8000/feature_mds");
    const correlation = JSON.parse(featureMds.data.correlation);
    const mds = featureMds.data.mds;
    const featurePosition = mds.reduce(
      (acc, val) => ({ ...acc, [val.name]: [val.x, val.y] }),
      {}
    );

    const minValues = mds.reduce(
      (acc, val) => ({
        ...acc,
        x: Math.min(acc.x, val.x),
        y: Math.min(val.y, acc.y),
      }),
      {
        x: Number.MAX_VALUE,
        y: Number.MAX_VALUE,
      }
    );

    const maxValues = mds.reduce(
      (acc, val) => ({
        ...acc,
        x: Math.max(acc.x, val.x),
        y: Math.max(val.y, acc.y),
      }),
      {
        x: Number.MIN_VALUE,
        y: Number.MIN_VALUE,
      }
    );

    xScale = d3
      .scaleLinear()
      .domain([minValues.x - 0.05, maxValues.x + 0.2])
      .range([margin, width - margin]);

    yScale = d3
      .scaleLinear()
      .domain([minValues.y - 0.05, maxValues.y + 0.2])
      .range([height - margin, margin]);

    // correlation lines
    const keys = Object.keys(correlation);
    const correlationData = [];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        correlationData.push({
          key1: keys[i],
          key2: keys[j],
          corr: correlation[keys[i]][keys[j]],
          pos1: featurePosition[keys[i]],
          pos2: featurePosition[keys[j]],
        });
      }
    }

    const greenColorScale = d3.scaleLinear().domain([0, 1]).range([0, 255]);

    const redColorScale = d3.scaleLinear().domain([-1, 0]).range([0, 255]);

    const line = d3
      .line()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]));

    const createOrderPath = () => {
      svg.selectAll(".o-path").remove("*");
      if (order.length > 1) {
        const orderPath = order
          .map((o, i) =>
            i < order.length - 1
              ? [
                  [o.x, o.y],
                  [order[i + 1].x, order[i + 1].y],
                ]
              : []
          )
          .filter((o) => o.length > 0);
        svg
          .selectAll("order-path")
          .data(orderPath)
          .enter()
          .append("path")
          .attr("class", "o-path")
          .attr("d", (d) => line(d))
          .attr("stroke", "black")
          .attr("stroke-width", 2);
        if (order.length === mds.length) {
          pcpPlot(
            null,
            order.map((o) => o.name)
          );
        }
      }
    };

    svg
      .selectAll("path")
      .data(correlationData)
      .enter()
      .append("path")
      .attr("d", (d) => line([d.pos1, d.pos2]))
      .attr("stroke", (d) => {
        let color = null;
        if (d.corr >= 0) {
          let colorVal = Math.round(greenColorScale(d.corr));
          let index = Math.max(0, Math.min(colorVal, 255));
          color = greenSwatch[index];
        } else {
          let colorVal = Math.round(redColorScale(d.corr));
          let index = Math.max(0, Math.min(colorVal, 255));
          color = redSwatch[index];
        }
        return color;
      })
      .attr("stroke-width", 2)
      .style("stroke-opacity", (d) => (d.corr >= 0 ? 0.5 : 0.4))
      .on("mouseover", (e, d) => {
        e.srcElement.style["stroke-opacity"] = 1;
        e.srcElement.style["stroke-width"] = 6;
      })
      .on("mouseout", (e, d) => {
        e.srcElement.style["stroke-opacity"] = d.corr >= 0 ? 0.5 : 0.4;
        e.srcElement.style["stroke-width"] = 2;
      });

    // circle
    svg
      .selectAll(".circle")
      .data(mds)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 7)
      .attr("fill", (d) => darkerVariableColors[d.name])
      .on("click", function (e, d) {
        let currIndex = order.indexOf(d);
        if (currIndex !== -1) {
          order.splice(currIndex, 1);
          d3.select(this).attr("stroke", "none");
        } else {
          order.push(d);
          d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
        }
        createOrderPath();
      });

    // feature order on render
    createOrderPath();

    // text
    svg
      .selectAll(".text")
      .data(mds)
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d.x))
      .attr("y", (d) => yScale(d.y))
      .text((d) => metadata[d.name]["displayName"])
      .style("fill", "black")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .attr(
        "transform",
        (d) => `translate(6, -5) rotate(-38, ${xScale(d.x)}, ${yScale(d.y)})`
      );

    // legend
    svg.append("g").call((g) =>
      g
        .selectAll("rect")
        .data(greenSwatch)
        .enter()
        .append("rect")
        .attr("width", 0.25)
        .attr("height", 12)
        .attr("x", (d, i) => width - 1.5 * margin + 0.25 * i)
        .attr("y", margin)
        .style("fill", (d) => d)
    );

    svg.append("g").call((g) =>
      g
        .selectAll("rect")
        .data(redSwatch)
        .enter()
        .append("rect")
        .attr("width", 0.25)
        .attr("height", 12)
        .attr("x", (d, i) => width - 1.5 * margin + 0.25 * i)
        .attr("y", margin + 24)
        .style("fill", (d) => d)
    );

    svg
      .append("text")
      .attr("x", width - 2 * margin - 55)
      .attr("y", margin + 8)
      .text("Positive Corr.")
      .style("font-size", "12px")
      .style("font-weight", 500)
      .attr("alignment-baseline", "middle");

    svg
      .append("text")
      .attr("x", width - 2 * margin - 60)
      .attr("y", margin + 32)
      .text("Negative Corr.")
      .style("font-size", "12px")
      .style("font-weight", 500)
      .attr("alignment-baseline", "middle");
  }

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(d3.axisBottom(xScale))
    .call((g) =>
      g
        .append("text")
        .attr("x", width - margin + 20)
        .attr("y", 30)
        .attr("fill", "#71797E")
        .style("font-size", "14px")
        .style("font-weight", 500)
        .style("text-decoration", "underline")
        .attr("text-anchor", "end")
        .text(`MDS Dim. 1`)
    );

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${margin}, 0)`)
    .call(d3.axisLeft(yScale))
    .call((g) =>
      g
        .append("text")
        .attr("x", -margin + 10)
        .attr("y", 40)
        .style("font-size", "14px")
        .style("font-weight", 500)
        .attr("fill", "#71797E")
        .style("text-decoration", "underline")
        .attr("text-anchor", "start")
        .text(`MDS Dim. 2`)
    );

  //title
  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "700")
    .style("text-decoration", "underline")
    .text(`${type === "data" ? "Data MDS Plot" : "Variables MDS Plot"}`);
};

export default mdsPlot;
