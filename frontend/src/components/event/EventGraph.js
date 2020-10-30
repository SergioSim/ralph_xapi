// import { Graph } from "react-d3-graph";
// import React, { Component } from "react";

// class EventGraph extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       myConfig: {
//         nodeHighlightBehavior: true,
//         node: {
//             color: "lightgreen",
//             size: 3000,
//             fontSize: 14,
//             highlightFontSize: 16,
//             highlightStrokeColor: "blue",
//             labelProperty: (node) => this.myCustomLabelBuilder(node),
//             labelPosition: "center",
//         },
//         link: {
//             highlightColor: "lightblue",
//         },
//         d3: {
//           gravity: -300,
//           linkLength: 100,
//         }
//       },
//     };
//   }

//   getData(){
//     return {
//       nodes: this.getNodes(),
//       links: this.getLinks(),
//     }
//   }

//   getNodes(){
//     const nodes = [];
//     nodes.push({id: "base"});
//     this.props.event.fields.forEach(x => nodes.push({id: x.id}));
//     return nodes;
//   }

//   getLinks(){
//     const links = [];
//     this.props.event.fields.forEach(x => links.push({target: "base", source: x.id}));
//     return links;
//   }

//   myCustomLabelBuilder(node) {
//     if(node.id == "base"){
//       return this.props.event.name;
//     }
//     const field = this.props.event.fields.get(parseInt(node.id))
//     if(field){
//       return field.name;
//     }
//     return node.id;
//   }

//   // graph event callbacks
//   onClickGraph() {
//     console.log(`Clicked the graph background`);
//   };

//   onClickNode(nodeId) {
//     console.log(`Clicked node ${nodeId}`);
//   };

//   onDoubleClickNode(nodeId) {
//     console.log(`Double clicked node ${nodeId}`);
//   };

//   onRightClickNode(event, nodeId) {
//     console.log(`Right clicked node ${nodeId}`);
//   };

//   onMouseOverNode(nodeId) {
//     console.log(`Mouse over node ${nodeId}`);
//   };

//   onMouseOutNode(nodeId) {
//     console.log(`Mouse out node ${nodeId}`);
//   };

//   onClickLink(source, target) {
//     console.log(`Clicked link between ${source} and ${target}`);
//   };

//   onRightClickLink(event, source, target) {
//     console.log(`Right clicked link between ${source} and ${target}`);
//   };

//   onMouseOverLink(source, target) {
//     console.log(`Mouse over in link between ${source} and ${target}`);
//   };

//   onMouseOutLink(source, target) {
//     console.log(`Mouse out link between ${source} and ${target}`);
//   };

//   onNodePositionChange(nodeId, x, y) {
//     console.log(`Node ${nodeId} is moved to new position. New position is x= ${x} y= ${y}`);
//   };

//   render() {
//     return (
//       <Graph
//         id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
//         data={(() => this.getData())()}
//         config={this.state.myConfig}
//         onClickNode={this.onClickNode}
//         onDoubleClickNode={this.onDoubleClickNode}
//         onRightClickNode={this.onRightClickNode}
//         onClickGraph={() => this.onClickGraph()}
//         onClickLink={this.onClickLink}
//         onRightClickLink={this.onRightClickLink}
//         onMouseOverNode={this.onMouseOverNode}
//         onMouseOutNode={this.onMouseOutNode}
//         onMouseOverLink={this.onMouseOverLink}
//         onMouseOutLink={this.onMouseOutLink}
//         onNodePositionChange={this.onNodePositionChange}
//       />
//     );
//   }
// }

// export default EventGraph;