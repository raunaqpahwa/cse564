import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { metadata, colors } from "./constants.js";

let globalK = 4,
  globalOrder = [...Object.keys(metadata)],
  completeRange = null;
let categoricalKeys = globalOrder.filter((k) => metadata[k]["isCategorical"]);

const findCompleteData = (pcp) => {
  completeRange = {};
  for (let record of pcp) {
    for (let key in record) {
      if (key === "cluster") {
        continue;
      }
      if (!(key in completeRange)) {
        if (metadata[key]["isCategorical"]) {
          completeRange[key] = [];
        } else {
          completeRange[key] = {
            min: Number.MAX_VALUE,
            max: Number.MIN_VALUE,
          };
        }
      } else {
        if (!metadata[key]["isCategorical"]) {
          completeRange[key]["min"] = Math.min(
            completeRange[key]["min"],
            record[key]
          );
          completeRange[key]["max"] = Math.max(
            completeRange[key]["max"],
            record[key]
          );
        } else if (!completeRange[key].includes(record[key])) {
          completeRange[key].push(record[key]);
        }
      }
    }
  }
};

const pcpPlot = async (k, order) => {
  if (k === null) {
    k = globalK;
  } else {
    globalK = k;
  }
  if (order !== null && order.length < globalOrder.length) {
    order = [...order, ...categoricalKeys];
  }
  if (order === null) {
    order = globalOrder;
  } else {
    globalOrder = order;
  }

  const svg = d3.select("#pcp-svg");
  svg.selectAll("*").remove();
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const marginX = 50,
    marginBottom = 128,
    marginTop = 30;
  const pcpData = await axios.get("http://localhost:8000/pcp_plot", {
    params: { k },
  });

  const pcp = pcpData.data;

  if (completeRange === null) {
    findCompleteData(pcp);
  }

  const yScale = [
    ...Array.from(order, (key) => {
      if (metadata[key]["isCategorical"]) {
        return [
          key,
          d3
            .scaleBand()
            .domain(completeRange[key])
            .range([marginTop, height - marginBottom])
            .padding(1),
        ];
      } else {
        return [
          key,
          d3
            .scaleLinear()
            .domain(d3.extent(pcp, (d) => d[key]))
            .range([height - marginBottom, marginTop]),
        ];
      }
    }),
  ].reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

  const xScale = d3
    .scalePoint()
    .domain(order)
    .range([marginX, width - marginX]);

  const orderRange = [xScale.range()[0]];

  for (let i = 1; i < order.length; i++) {
    orderRange.push(Math.round(orderRange[i - 1] + xScale.step()));
  }

  const line = d3
    .line()
    .x(([key, _]) => xScale(key))
    .y(([key, value]) => yScale[key](value));

  const path = svg
    .append("g")
    .selectAll("path")
    .data(pcp)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (d) => colors[d["cluster"]])
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.4)
    .attr("d", (d) => {
      return line(d3.cross(order, [d], (key, d) => [key, d[key]]));
    });

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - marginBottom})`)
    .call(d3.axisBottom(xScale).tickFormat((d) => metadata[d]["displayName"]))
    .call((g) => g.select(".domain").remove())
    .selectAll("text")
    .attr("transform", "rotate(-90) translate(-68, -14)")
    .attr("font-weight", "bold");

  const brushWidth = 40;
  const selections = {};
  const brush = d3
    .brushY()
    .extent([
      [-(brushWidth / 2), marginTop],
      [brushWidth / 2, height - marginBottom],
    ])
    .on("start brush end", ({ selection }, key) => {
      if (selection === null) {
        delete selections[key];
      } else if (!metadata[key]["isCategorical"]) {
        selections[key] = selection.map(yScale[key].invert);
      } else {
        const allValues = completeRange[key];
        const valuePositions = allValues.map((val) => yScale[key](val));
        for (let i = 0; i < allValues.length; i++) {
          if (
            valuePositions[i] >= selection[0] &&
            valuePositions[i] <= selection[1]
          ) {
            if (!(key in selections)) {
              selections[key] = [];
            }
            selections[key].push(allValues[i]);
          }
        }
      }
      const selected = [];
      path.each(function (d) {
        const active = [...Object.entries(selections)].every(([key, val]) =>
          metadata[key]["isCategorical"]
            ? val.includes(d[key])
            : d[key] >= val[1] && d[key] <= val[0]
        );
        d3.select(this).style("stroke", active ? colors[d["cluster"]] : "#ddd");
        if (active) {
          d3.select(this).raise();
          selected.push(d);
        }
      });
      svg.property("value", selected).dispatch("input");
    });

  svg
    .append("g")
    .selectAll("axis")
    .data(order)
    .join("g")
    .attr("transform", (d) => `translate(${xScale(d)}, 0)`)
    .call(brush)
    .call(
      d3.drag().on("end", (d) => {
        let currIndex = order.indexOf(d.subject);
        if (d.x <= orderRange.at(0)) {
          order.splice(currIndex, 1);
          order.unshift(d.subject);
          pcpPlot(globalK, order);
        } else if (d.x >= orderRange.at(-1)) {
          order.splice(currIndex, 1);
          order.push(d.subject);
          pcpPlot(globalK, order);
        } else {
          let newIndex = null;
          for (let i = 0; i < orderRange.length - 1; i++) {
            if (d.x >= orderRange[i] && d.x <= orderRange[i + 1]) {
              newIndex = i + 1 >= currIndex ? i : i + 1;
              break;
            }
          }
          order.splice(currIndex, 1);
          order.splice(newIndex, 0, d.subject);
          pcpPlot(globalK, order);
        }
      })
    )
    .each(function (d) {
      d3.select(this).call(
        d3.axisLeft(yScale[d]).tickFormat(function (d) {
          if (typeof d === "string") {
            d3.select(this).attr("transform", "rotate(-90) translate(8, -12)");
          }
          return d;
        })
      );
    })
    .call((g) =>
      g
        .selectAll("text")
        .clone(true)
        .lower()
        .attr("fill", "black")
        .attr("stroke", "white")
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
    );

  //title
  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "700")
    .style("text-decoration", "underline")
    .text(`Parallel Coordinates Plot`);
};

export default pcpPlot;
