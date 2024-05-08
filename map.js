import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import { boroughColors, selectedBoroughColors, metadata } from './constants.js'
import barChart from './barChart.js'
import treeMap from './treeMap.js'
import plotBoroughBarChart from './boroughBarChart.js'

let boundaryData = await d3.json('./map/boroughs.geojson')
let subwayData = await d3.json('./map/subway.geojson')
let subwayStationsData = await d3.json('./map/subway_stations.geojson')
let collegeData = await d3.csv('./colleges_cleaned.csv')
let computersData = await d3.csv('./computers_cleaned.csv')
let schoolsData = await d3.csv('./schools_cleaned.csv')
let hospitalsData = await d3.csv('./hospitals_cleaned.csv')
let housingData = await d3.csv('./housing_cleaned.csv')
let selectedBorough = null

const borroughs = ['Staten Island', 'Manhattan', 'Queens', 'Brooklyn', 'Bronx']
const mapData = {
  ...boundaryData,
  features: boundaryData.features.filter(({ properties: { boro_name } }) =>
    borroughs.includes(boro_name)
  )
}

const tooltip = d3.select('.tooltip')

const renderMap = borough => {
  const svg = d3.select('#map-svg')
  const width = svg.node().clientWidth
  const height = svg.node().clientHeight
  if (borough !== undefined) {
    if (borough === 'StatenIsland') {
      borough = 'Staten Island'
    }
    selectedBorough = borough
  }

  const projection = d3.geoMercator().fitSize([width, height], mapData)
  const path = d3.geoPath().projection(projection)

  svg
    .selectAll('path')
    .data(mapData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('id', d => `map-${d.properties.boro_name.split(' ').join('')}`)
    .attr('fill', d => {
      const boro_name = d.properties.boro_name
      return selectedBorough === null || selectedBorough === boro_name
        ? boroughColors[boro_name]
        : '#a6a6a6'
    })
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
    .attr('cursor', 'pointer')
    .on('mouseover', (e, d) => {
      tooltip
        .style('display', 'flex')
        .html(d.properties.boro_name)
        .style('left', e.pageX + 15 + 'px')
        .style('top', e.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })
    .on('click', function (event, d) {
      let clickedBorough = d.properties.boro_name
      console.log(clickedBorough)

      if (selectedBorough === clickedBorough) {
        selectedBorough = null

        svg.selectAll('path.subway').remove()

        svg.selectAll('path').attr('fill', d => {
          const boro_name = d.properties.boro_name
          return boroughColors[boro_name]
        })

        // Add the path back to the map
        svg
          .selectAll('.subway')
          .data(subwayData.features)
          .enter()
          .append('path')
          .attr('class', 'subway')
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', 'black')
          .attr('stroke-width', 0.4)
          .style('opacity', 0.5)

        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity)
        barChart()
        treeMap()
      } else {
        svg.selectAll('path.subway').remove()

        svg.selectAll('path').attr('fill', d => {
          const boro_name = d.properties.boro_name
          return boro_name === clickedBorough
            ? selectedBoroughColors[boro_name]
            : '#a6a6a6'
        })

        // Add the path back to the map
        svg
          .selectAll('.subway')
          .data(subwayData.features)
          .enter()
          .append('path')
          .attr('class', 'subway')
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', 'black')
          .attr('stroke-width', 0.4)
          .style('opacity', 0.5)

        selectedBorough = clickedBorough

        const bounds = path.bounds(d)
        const dx = bounds[1][0] - bounds[0][0]
        const dy = bounds[1][1] - bounds[0][1]
        const x = (bounds[0][0] + bounds[1][0]) / 2
        const y = (bounds[0][1] + bounds[1][1]) / 2
        const scale = Math.max(
          1,
          Math.min(8, 0.9 / Math.max(dx / width, dy / height))
        )
        const translate = [width / 2 - scale * x, height / 2 - scale * y]
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          )

        if (event.isTrusted) {
          // Bar chart
          let modBorough =
            selectedBorough === 'Staten Island'
              ? 'StatenIsland'
              : selectedBorough

          plotBoroughBarChart(modBorough)
          treeMap()
          // Tree map
          const boroughBlock = d3
            .selectAll("g[id*='treemap-']")
            .filter((treeBlock, i) =>
              treeBlock.data.name.includes(modBorough) ? true : false
            )
          console.log(boroughBlock)
          const currBorough = boroughBlock._groups[0][0]
          if (currBorough) {
            d3.select(`#${currBorough.id}`).dispatch('click')
          }
        }
      }
      console.log(selectedBorough)
    })

  // Subway lines
  svg
    .selectAll('.subway')
    .data(subwayData.features)
    .enter()
    .append('path')
    .attr('class', 'subway')
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.4)
    .style('opacity', 0.5)

  // Subway stations
  svg
    .selectAll('.subway-station')
    .data(subwayStationsData.features)
    .enter()
    .append('image')
    .attr('class', 'subway-station')
    .attr('xlink:href', 'train.svg')
    .attr('width', '2')
    .attr('height', '2')
    .attr('x', d => projection(d.geometry.coordinates)[0])
    .attr('y', d => projection(d.geometry.coordinates)[1])
    .on('mouseover', function (event, d) {
      tooltip
        .style('display', 'flex')
        .html(d.properties.stop_name)
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })

  // Colleges (hover fix needed)
  svg
    .selectAll('.college')
    .data(collegeData)
    .enter()
    .append('image')
    .attr('class', 'college')
    .attr('xlink:href', 'college.svg')
    .attr('width', '3')
    .attr('height', '3')
    .attr('x', d => projection([d.Longitude, d.Latitude])[0])
    .attr('y', d => projection([d.Longitude, d.Latitude])[1])
    .on('mouseover', function (event, d) {
      tooltip
        .style('display', 'flex')
        .html(`${d['NAME']}`)
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })

  // Computers
  svg
    .selectAll('.computer')
    .data(computersData)
    .enter()
    .append('image')
    .attr('class', 'computer')
    .attr('xlink:href', 'computer.svg')
    .attr('width', '3')
    .attr('height', '3')
    .attr('x', d => projection([d.Longitude, d.Latitude])[0])
    .attr('y', d => projection([d.Longitude, d.Latitude])[1])
    .on('mouseover', function (event, d) {
      tooltip
        .style('display', 'flex')
        .html(`${d['Oversight Agency']} - ${d['Full Location Address']}`)
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })

  // Schools
  svg
    .selectAll('.school')
    .data(schoolsData)
    .enter()
    .append('image')
    .attr('class', 'school')
    .attr('xlink:href', 'school.svg')
    .attr('width', '3')
    .attr('height', '3')
    .attr('x', d => projection([d.Longitude, d.Latitude])[0])
    .attr('y', d => projection([d.Longitude, d.Latitude])[1])
    .on('mouseover', function (event, d) {
      tooltip
        .style('display', 'flex')
        .html(d['School Name'])
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })

  // Hospitals
  svg
    .selectAll('.hospital')
    .data(hospitalsData)
    .enter()
    .append('image')
    .attr('class', 'hospital')
    .attr('xlink:href', 'hospital.svg')
    .attr('width', '3')
    .attr('height', '3')
    .attr('x', d => projection([d.Longitude, d.Latitude])[0])
    .attr('y', d => projection([d.Longitude, d.Latitude])[1])
    .on('mouseover', function (event, d) {
      tooltip
        .style('display', 'flex')
        .html(d['Facility Name'])
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })

  // Housing
  svg
    .selectAll('.housing')
    .data(housingData)
    .enter()
    .append('image')
    .attr('class', 'housing')
    .attr('xlink:href', 'house.svg')
    .attr('width', '2')
    .attr('height', '2')
    .attr('x', d => projection([d.Longitude, d.Latitude])[0])
    .attr('y', d => projection([d.Longitude, d.Latitude])[1])
    .on('mouseover', function (event, d) {
      tooltip
        .style('display', 'flex')
        .html(`${d['Number']} - ${d['Street']}`)
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px')
    })
    .on('mouseout', function (d) {
      tooltip.html('').style('display', 'none')
    })

  // Zoom functionality
  const zoom = d3.zoom().on('zoom', zoomed)

  svg.call(zoom)

  function zoomed (event) {
    svg.selectAll('path').attr('transform', event.transform)
    svg.selectAll('circle').attr('transform', event.transform)
    svg.selectAll('image').attr('transform', event.transform)
  }

  // Toggle subway visibility
  d3.select('#map-type-subway').on('click', e => {
    const subwayStations = svg.selectAll('.subway-station')
    const isVisible = e.target.checked
    subwayStations.style('opacity', isVisible ? 0.8 : 0)
  })

  // Toggle subway line visibility
  d3.select('#map-type-subway-lines').on('click', e => {
    const subway = svg.selectAll('.subway')
    const isVisible = e.target.checked
    subway.style('opacity', isVisible ? 0.8 : 0)
  })

  // Toggle colleges visibility
  d3.select('#map-type-colleges').on('click', e => {
    const colleges = svg.selectAll('.college')
    const isVisible = e.target.checked
    colleges.style('opacity', isVisible ? 1 : 0)
  })

  // Toggle computer visibility
  d3.select('#map-type-computers').on('click', e => {
    const computers = svg.selectAll('.computer')
    const isVisible = e.target.checked
    console.log('Computer centers visible?', isVisible)
    computers.style('opacity', isVisible ? 1 : 0)
  })

  // Toggle schools visibility
  d3.select('#map-type-schools').on('click', e => {
    const schools = svg.selectAll('.school')
    const isVisible = e.target.checked
    console.log('Schools visible?', isVisible)
    schools.style('opacity', isVisible ? 1 : 0)
  })

  // Toggle hospitals visibility
  d3.select('#map-type-hospitals').on('click', e => {
    const hospitals = svg.selectAll('.hospital')
    const isVisible = e.target.checked
    console.log('Hospitals visible?', isVisible)
    hospitals.style('opacity', isVisible ? 1 : 0)
  })

  // Toggle housing visibility
  d3.select('#map-type-housing').on('click', (e, d) => {
    const housing = svg.selectAll('.housing')
    const isVisible = e.target.checked
    console.log('Housing visible?', isVisible)
    housing.style('opacity', isVisible ? 1 : 0)
  })
}

export default renderMap
