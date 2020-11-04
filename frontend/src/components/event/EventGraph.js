import './EventGraph.css';
import React, { Component } from "react";
import * as d3 from "d3";
import feather from 'feather-icons/dist/feather';
import { data } from 'jquery';
import EventFieldPopup from './EventFieldPopup';
import { eventNature } from '../../common';

class EventGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipStyle: {
        top: 0,
        left: 0,
        display: "none"
      },
      tooltipField: null,
      showExcluded: true,
      eventYSlider: 40,
      eventXSlider: 500,
    }
    this.graphRef = React.createRef();
    this.tooltipChange = false;
    this.clickedOnNode = false;
    this.width = 954;
  }

  componentDidMount() {
    this.updateGraph();
  }

  componentDidUpdate() {
    if(!this.tooltipChange) {
      this.updateGraph();
    }
    this.tooltipChange = false;
  }

  handleChange(event) {
    this.setState({[event.target.name]: event.target.value})
  }

  prepareEventGraphData(event, arr) {
    event.fields.forEach(field => {
      if(!this.state.showExcluded && field.excluded){
        return;
      }
      const children = [];
      if (field.nature == eventNature.NESTED) {
        const nature = this.props.natures.get(eventNature.NESTED).get(field.nature_id);
        if(!nature) return;
        const nested = this.props.events.get(nature.event);
        this.prepareEventGraphData(nested, children);
      }
      arr.push({name: field.name, value: field, children});
    });
    arr.sort((a, b) => {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    return arr;
  }
  
  prepareXapiGraphData(event, arr) {
    return;
  }

  getXapiRoot() {
    const value = this.props.event;
    const name = `XAPI(${value.name})`;
    const children = this.prepareXapiGraphData(value, []);
    return;
  }

  getEventRoot(){
    const value = this.props.event;
    const name = value.name;
    const children = this.prepareEventGraphData(value, []);
    const root = d3.hierarchy({name, children, value});
    root.dx = this.state.eventYSlider;
    root.dy = this.state.eventXSlider;
    return d3.tree().nodeSize([root.dx, root.dy])(root);
  }

  updateGraph() {
    const eventRoot = this.getEventRoot();
    console.log(eventRoot);
    const xapiRoot = this.getXapiRoot();
    d3.selectAll(this.graphRef.current.children).remove();
    const svg = d3.select(this.graphRef.current).attr("viewBox", [-150, 0, this.width, eventRoot.dx * 2]);
    this.populateSvg(svg, eventRoot, xapiRoot);
    feather.replace();
  }

  populateSvg(svg, eventRoot, xapiRoot) {
    svg.on("click", () => this.removeTooltip());
    const g = svg.append("g");
    
    this.tooltipTransformX = 0;
    this.tooltipTransformY = 0;
    svg.call(d3.zoom().transform, d3.zoomIdentity);
    svg.call(d3.zoom().on("zoom", (event) => {
      const pos = event.transform;
      const tootip = this.state.tooltipStyle;
      g.attr("transform", pos);
      this.tooltipChange = true;
      this.tooltipTransformX = pos.x;
      this.tooltipTransformY = pos.y;
      this.setState({tooltipStyle: {
        top: tootip.top,
        left: tootip.left,
        display: tootip.display,
        transform: "translate(" + this.tooltipTransformX + "px, " + this.tooltipTransformY + "px)",
      }});
    }));

    const link = g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", "2px")
      .selectAll("path")
        .data(eventRoot.links())
        .join("path")
          .attr("d", d3.linkHorizontal()
              .x(d => d.y)
              .y(d => d.x));
    
    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(eventRoot.descendants())
        .join("g")
          .attr("class", "node")
          .attr("transform", d => `translate(${d.y},${d.x})`)
          .on("click", (treeNode, d) => this.clickNode(treeNode, d));
  
    node.append("span")
        .style("color", d => d.data.value.required ? "#f44336" : "#ccc")
        .attr("data-feather", "alert-triangle")
        .attr("width", 20)
        .attr("x", 12)
        .attr("y", -12);
  
    node.append("span")
        .style("color", d => d.data.value.allow_none ? "#ccc" : "#2196f3")
        .attr("data-feather", "x-circle")
        .attr("width", 20)
        .attr("x", -6)
        .attr("y", -12);

    const text = node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 36)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .style("fill", d => d.data.value.excluded ? "#ccc" : "#212529")
        .text(d => d.data.name);

    text.append("tspan")
          .style("fill", "#3eac34")
          .text(d => ` [${this.getNatureFromNode(d.data.value)}]`);
    
    text.clone(true).lower().attr("stroke", "white");
  }

  getNatureFromNode(node){
    if (typeof node.nature !== 'undefined'){
      return node.nature;
    }
    return "Event";
  }

  clickNode(event, treeNode){
    this.tooltipChange = true;
    this.clickedOnNode = true;
    this.setState({
      tooltipStyle: {
        top: (event.layerY - this.tooltipTransformY - 50),
        left: (event.layerX - this.tooltipTransformX),
        display: "block",
        transform: "translate(" + this.tooltipTransformX + "px, " + this.tooltipTransformY + "px)",
      },
      tooltipField: treeNode.data.value
    });
  }

  removeTooltip(){
    // is run after the clickNode!
    if(this.clickedOnNode){
      this.clickedOnNode = false;
      return;
    }
    this.tooltipChange = true;
    this.setState({tooltipStyle: {display: "none"}})
  }

  toggleShowAddField(field) {
    this.setState({tooltipStyle: {display: "none"}});
    this.props.toggleShowAddField(field);
  }

  toggleShowValidateField(field) {
    this.setState({tooltipStyle: {display: "none"}});
    this.props.toggleShowValidateField(field);
  }

  deleteEventField(field) {
    this.props.deleteEventField(field, () => {
      this.setState({tooltipStyle: {display: "none"}});
    });
  }

  toggleShowExcluded() {
    this.setState((state, props) => ({showExcluded: !state.showExcluded}));
  }

  render() {
    return (
      <div>
        <EventFieldPopup
        event={this.props.event}
        events={this.props.events}
        natures={this.props.natures}
        field={this.state.tooltipField}
        style={this.state.tooltipStyle}
        toggleShowAddField={(field) => this.toggleShowAddField(field)}
        toggleShowValidateField={(field) => this.toggleShowValidateField(field)}
        deleteEventField={(field) => this.deleteEventField(field)}
        showExcluded={this.state.showExcluded}
        toggleShowExcluded={(showExcluded) => this.toggleShowExcluded(showExcluded)}
        />
        <label htmlFor="eventXSlider" className="m-3">X</label>
        <input type="range" name="eventXSlider" id="eventXSlider" min="40" max="1000" value={this.state.eventXSlider} onChange={(e) => this.handleChange(e)}/>
        <label htmlFor="eventYSlider" className="m-3">Y</label>
        <input type="range" name="eventYSlider" id="eventYSlider" min="20" max="200" value={this.state.eventYSlider} onChange={(e) => this.handleChange(e)}/>
        <svg id="event-graph" ref={this.graphRef}></svg>
      </div>
    );
  }
}

export default EventGraph;
