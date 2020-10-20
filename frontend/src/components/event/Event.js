import React, { Component } from "react";

class Event extends Component {
  constructor(props){
    super(props)
  }

  render() {
    return (
      <div>
        Event: {this.props.event.name} <br/>
        Description: {this.props.event.description}
      </div>
    );
  }
}

export default Event;