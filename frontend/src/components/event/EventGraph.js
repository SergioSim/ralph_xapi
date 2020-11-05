import './EventGraph.css';
import React, { Component } from "react";
import * as d3 from "d3";
import feather from 'feather-icons/dist/feather';
import Api from '../../services/api.service'
import { alertService } from '../../services/alert.service';
import EventFieldPopup from './EventFieldPopup';
import XapiFieldPopup from './XapiFieldPopup';
import { eventNature } from '../../common';

class EventGraph extends Component {
  constructor(props) {
    super(props);
    this.api = new Api();
    this.state = {
      tooltipStyle: {
        top: 0,
        left: 0,
      },
      eventTooltipHidden: true,
      xapiTooltipHidden: true,
      tooltipField: null,
      showExcluded: true,
      eventYSlider: 80,
      eventXSlider: 280,
      eventXapiGapSlider: 350,
    }
    this.graphRef = React.createRef();
    this.tooltipChange = false;
    this.clickedOnNode = false;
    this.width = 954;
    this.keepZoom = false;
    this.previousZoom = { k: 1, x: 0, y: 0 }
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
    this.keepZoom = true;
    this.setState({[event.target.name]: event.target.value})
  }

  sortFieldsByName(a, b){
    const textA = a.name.toUpperCase();
    const textB = b.name.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
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
    arr.sort(this.sortFieldsByName);
    return arr;
  }
  
  prepareXapiGraphData(event, arr) {
    // TODO: handle xapi fields having parent xapi fields
    event.xapiFields.forEach(field => {
      const children = [];
      arr.push({name: field.name, value: field, children});
    })
    arr.sort(this.sortFieldsByName);
    return arr;
  }

  updateXapiTreePosition(tree, translateX) {
    if(!tree.yInitial){
      tree.yInitial = tree.y;
    }
    tree.y = tree.yInitial + translateX;
    if (!tree.children) return;
    tree.children.forEach((child) => this.updateXapiTreePosition(child, translateX))
  }

  getXapiRoot(height) {
    const value = this.props.event;
    const name = `XAPI(${value.name})`;
    const children = this.prepareXapiGraphData(value, []);
    // const children = this.prepareEventGraphData(value, []);
    const root = d3.hierarchy({name, children, value});
    root.dx = this.state.eventYSlider;
    root.dy = this.state.eventXSlider;
    const tree = d3.tree().nodeSize([root.dx, -root.dy])(root);
    const translateX = tree.height * parseInt(this.state.eventXSlider) + height * parseInt(this.state.eventXSlider) + parseInt(this.state.eventXapiGapSlider);
    this.updateXapiTreePosition(tree, translateX);
    return tree;
  }

  getEventRoot(){
    const value = this.props.event;
    const name = value.name;
    const children = this.prepareEventGraphData(value, []);
    const root = d3.hierarchy({name, children, value});
    root.dx = this.state.eventYSlider;
    root.dy = this.state.eventXSlider;
    root.x = 400;
    return d3.tree().nodeSize([root.dx, root.dy])(root);
  }

  updateGraph() {
    const eventRoot = this.getEventRoot();
    const xapiRoot = this.getXapiRoot(eventRoot.height);
    d3.selectAll(this.graphRef.current.children).remove();
    const svg = d3.select(this.graphRef.current).attr("viewBox", [-150, 0, this.width, eventRoot.dx * 2]);
    this.populateSvg(svg, eventRoot, xapiRoot);
    feather.replace();
  }

  addXapiLink(eventField, xapiField) {
    console.log("add link", xapiField, eventField, this);
    const data = {"event_fields": [...xapiField.event_fields, eventField.id]};
    this.api.updateXAPIField(xapiField.id, data).then(field => {
      if (!field) return;
      this.props.updateField(field, true);
      alertService.success(`Added Field ${eventField.name} with success!`);
    });
  }

  drawToolTip(svg, g){
    if (this.keepZoom) {
      g.attr("transform", this.previousZoom);
      this.keepZoom = false;
    } else {
      svg.call(d3.zoom().transform, d3.zoomIdentity);
    }
    this.tooltipTransformX = 0;
    this.tooltipTransformY = 0;
    svg.call(d3.zoom().on("zoom", (event) => {
      const pos = event.transform;
      this.previousZoom = pos;
      const tootip = this.state.tooltipStyle;
      g.attr("transform", pos);
      this.tooltipChange = true;
      this.tooltipTransformX = pos.x;
      this.tooltipTransformY = pos.y;
      this.setState({tooltipStyle: {
        top: tootip.top,
        left: tootip.left,
        transform: "translate(" + this.tooltipTransformX + "px, " + this.tooltipTransformY + "px)",
      }});
    }));
  }

  drawLinks(g, root){
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", "2px")
      .selectAll("path")
        .data(root.links())
        .join("path")
          .attr("d", d3.linkHorizontal()
              .x(d => d.y)
              .y(d => d.x));
  }

  getClickableNode(g, root, onclick) {
    return g.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", onclick);
  }

  dragAndDrop(g, node, xapiNode) {
    const thisEventGraph = this;
    xapiNode.call(d3.drag().on("start", function(event) {
      thisEventGraph.selectedField = null;
      node.append("circle")
        .attr('class', 'ghostCircle')
        .attr("r", 30)
        .attr("opacity", 0.2)
        .style("fill", "red")
        .attr("transform", "translate(3,0)")
        .attr('pointer-events', 'mouseover')
        .on("mouseover", function(event) {
          thisEventGraph.selectedField = this.__data__.data.value;
        })
        .on("mouseout", function(event) {
          thisEventGraph.selectedField = null;
        });
      }).on("drag", function(event) {
        const data = [{
          source: {
            x: event.subject.x,
            y: event.subject.y
          },
          target: {
            // WHY D3 ... WHY ?
            x: event.subject.x + event.y - event.subject.y,
            y: event.subject.y + event.x - event.subject.x,
          }
        }];
        d3.selectAll(".templink").remove();
        g.append("g")
          .attr("fill", "none")
          .attr("stroke", "#ccc")
          .attr("stroke-width", "2px")
          .attr("class", "templink")
          .selectAll("path")
            .data(data)
            .join("path")
              .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));
      }).on("end", function(event) {
        d3.selectAll(".templink").remove();
        d3.selectAll(".ghostCircle").remove();
        // const x =  event.subject.y + event.x - event.subject.x;
        // const y =  event.subject.x + event.y - event.subject.y;
        console.log();
        if (thisEventGraph.selectedField) {
          thisEventGraph.addXapiLink(thisEventGraph.selectedField, this.__data__.data.value);
        }
      })
    );
  }

  populateSvg(svg, eventRoot, xapiRoot) {
    svg.on("click", () => this.removeTooltip());
    const g = svg.append("g");
    this.drawToolTip(svg, g);
    
    this.drawLinks(g, eventRoot);
    this.drawLinks(g, xapiRoot);
    
    const node = this.getClickableNode(g, eventRoot, (treeNode, d) => this.clickNode(treeNode, d, "eventTooltipHidden"));
    const xapiNode = this.getClickableNode(g, xapiRoot, (treeNode, d) => this.clickNode(treeNode, d, "xapiTooltipHidden"));
    this.dragAndDrop(g, node, xapiNode);
    xapiNode.append("span")
      .style("color", "#2196f3")
      .attr("data-feather", "circle")
      .attr("width", 20)
      .attr("x", -6)
      .attr("y", -12);

    const xapiText = xapiNode.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? 18 : -6)
      .attr("text-anchor", d => d.children ? "start" : "end")
      .style("fill", "#3eac34")
      .text(d => ` [${this.getNatureFromNode(d.data.value)}]`);
    
    xapiText.append("tspan")
      .style("fill", "#212529")
      .text(d => d.data.name);
  
    node.append("span")
        .style("color", d => d.data.value.required ? "#f44336" : "#ccc")
        .attr("data-feather", "alert-triangle")
        .attr("width", 20)
        .attr("fill", "white")
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
    xapiText.clone(true).lower().attr("stroke", "white");
  }

  getNatureFromNode(node){
    if (typeof node.nature !== 'undefined'){
      return node.nature;
    }
    return "Event";
  }

  clickNode(event, treeNode, tooltip) {
    this.tooltipChange = true;
    this.clickedOnNode = true;
    const hideTooltip = tooltip == "eventTooltipHidden" ? "xapiTooltipHidden" : "eventTooltipHidden";
    this.setState({
      [tooltip]: false,
      [hideTooltip]: true,
      tooltipStyle: {
        top: (event.layerY - this.tooltipTransformY - 50),
        left: (event.layerX - this.tooltipTransformX),
        transform: "translate(" + this.tooltipTransformX + "px, " + this.tooltipTransformY + "px)",
      },
      tooltipField: treeNode.data.value
    });
  }

  hideTooltips() {
    this.setState({eventTooltipHidden: true, xapiTooltipHidden: true})
  }

  removeTooltip() {
    // is run after clickNode!
    if(this.clickedOnNode){
      this.clickedOnNode = false;
      return;
    }
    this.tooltipChange = true;
    this.hideTooltips()
  }

  toggleShowAddField(field, isXapi) {
    this.hideTooltips()
    this.props.toggleShowAddField(field, isXapi);
  }

  toggleShowValidateField(field) {
    this.hideTooltips()
    this.props.toggleShowValidateField(field);
  }

  deleteEventField(field) {
    this.props.deleteEventField(field, () => {
      this.hideTooltips()
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
        eventTooltipHidden={this.state.eventTooltipHidden}
        toggleShowAddField={(field) => this.toggleShowAddField(field, false)}
        toggleShowValidateField={(field) => this.toggleShowValidateField(field)}
        deleteEventField={(field) => this.deleteEventField(field)}
        showExcluded={this.state.showExcluded}
        toggleShowExcluded={(showExcluded) => this.toggleShowExcluded(showExcluded)}
        />
        <XapiFieldPopup
        event={this.props.event}
        field={this.state.tooltipField}
        style={this.state.tooltipStyle}
        xapiTooltipHidden={this.state.xapiTooltipHidden}
        toggleShowAddField={(field) => this.toggleShowAddField(field, true)}
        toggleShowValidateField={(field) => this.toggleShowValidateField(field)}
        deleteEventField={(field) => this.deleteEventField(field)}
        />
        <label htmlFor="eventXSlider" className="m-3">X</label>
        <input type="range" name="eventXSlider" id="eventXSlider" min="40" max="1000" value={this.state.eventXSlider} onChange={(e) => this.handleChange(e)}/>
        <label htmlFor="eventYSlider" className="m-3">Y</label>
        <input type="range" name="eventYSlider" id="eventYSlider" min="20" max="200" value={this.state.eventYSlider} onChange={(e) => this.handleChange(e)}/>
        <label htmlFor="eventXapiGapSlider" className="m-3">Event-Xapi-Gap</label>
        <input type="range" name="eventXapiGapSlider" id="eventXapiGapSlider" min="0" max="1000" value={this.state.eventXapiGapSlider} onChange={(e) => this.handleChange(e)}/>
        <svg id="event-graph" ref={this.graphRef}></svg>
      </div>
    );
  }
}

export default EventGraph;
