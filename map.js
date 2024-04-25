import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import { boroughColors, selectedBoroughColors, metadata } from './constants.js'

boroughColors['Staten Island'] = '#FFEB3B'
selectedBoroughColors['Staten Island'] = '#DBC300'
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

const renderMap = () => {
  const svg = d3.select('#map-svg')
  const width = 750
  const height = 500

  const projection = d3.geoMercator().fitSize([width, height], mapData)
  const path = d3.geoPath().projection(projection)

  svg.attr('width', width).attr('height', height)

  svg
    .selectAll('path')
    .data(mapData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', d => {
      const boro_name = d.properties.boro_name
      return boroughColors[boro_name]
    })
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
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
      if (selectedBorough === clickedBorough) {
        selectedBorough = null
        svg.selectAll('path').attr('fill', d => {
          const boro_name = d.properties.boro_name
          return boroughColors[boro_name]
        })
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity)
      } else {
        svg.selectAll('path').attr('fill', d => {
          const boro_name = d.properties.boro_name
          return boro_name === clickedBorough
            ? selectedBoroughColors[boro_name]
            : boroughColors[boro_name]
        })
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
      }
      console.log(selectedBorough)
    })

  // Subway lines
  svg
    .selectAll('path.subway')
    .data(subwayData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('class', 'subway')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.4)
    .style('opacity', 0.5)

  // Subway stations
  svg
    .selectAll('circle.subway-station')
    .data(subwayStationsData.features)
    .enter()
    .append('circle')
    .attr('cx', d => projection(d.geometry.coordinates)[0])
    .attr('cy', d => projection(d.geometry.coordinates)[1])
    .attr('r', 0.6)
    .attr('fill', 'black')
    .attr('stroke', 'white')
    .attr('stroke-width', 0.1)
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
    .selectAll('circle.college')
    .data(collegeData)
    .enter()
    .append('circle')
    .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
    .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
    .attr('r', 0.6)
    .attr('fill', 'green')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
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
    .selectAll('circle.computer')
    .data(computersData)
    .enter()
    .append('circle')
    .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
    .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
    .attr('r', 0.6)
    .attr('fill', 'blue')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
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
    .selectAll('circle.school')
    .data(schoolsData)
    .enter()
    .append('circle')
    .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
    .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
    .attr('r', 0.6)
    .attr('fill', 'purple')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
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
    .selectAll('circle.hospital')
    .data(hospitalsData)
    .enter()
    .append('circle')
    .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
    .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
    .attr('r', 0.6)
    .attr('fill', 'red')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
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
    .selectAll('circle.housing')
    .data(housingData)
    .enter()
    .append('circle')
    .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
    .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
    .attr('r', 0.6)
    .attr('fill', 'white')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.1)
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
  }

  // Reset zoom
  d3.select('#reset-zoom').on('click', () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity)
  })

  // Toggle subway visibility
  d3.select('#map-type-subway').on('click', () => {
    const subway = svg.selectAll('path.subway')
    const subwayStations = svg.selectAll('circle')
    const isVisible = subway.style('opacity') === '0.8'
    subway.style('opacity', isVisible ? 0 : 0.8)
    subwayStations.style('opacity', isVisible ? 0 : 0.8)
  })

  // Toggle colleges visibility
  d3.select('#map-type-colleges').on('click', () => {
    const colleges = svg.selectAll('circle.college')
    const isVisible = colleges.style('opacity') === '1'
    colleges.style('opacity', isVisible ? 0 : 1)
  })
}

const plot = async () => {
  renderMap()
}

export default plot
