import React, { Component } from "react";
import feather from 'feather-icons/dist/feather';
import { eventNature, booleanNatures} from '../../common';

class EventFieldPopup extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(){
    feather.replace();
  }

  getProperties() {
    if (this.props.field.nature == eventNature.IPV4) {
      const nature = this.props.natures.get(eventNature.IPV4).get(this.props.field.nature_id);
      return (
        <div>
          <h6 className="m-0"> Properties: </h6>
          Exploded: <span className="badge badge-secondary">{nature.exploded ? "True" : "False"}</span>
          <hr/>
        </div>
      );
    }
    if (this.props.field.nature == eventNature.URL) {
      const nature = this.props.natures.get(eventNature.URL).get(this.props.field.nature_id);
      return (
        <div>
          <h6 className="m-0"> Properties: </h6>
          Relative: <span className="badge badge-secondary">{nature.relative ? "True" : "False"}</span>
          <hr/>
        </div>
      );
    }
    if (this.props.field.nature == eventNature.INTEGER) {
      const nature = this.props.natures.get(eventNature.INTEGER).get(this.props.field.nature_id);
      return (
        <div>
          <h6 className="m-0"> Properties: </h6>
          Strict: <span className="badge badge-secondary">{nature.strict ? "True" : "False"}</span>
          <hr/>
        </div>
      );
    }
    if (this.props.field.nature == eventNature.LIST) {
      const nature = this.props.natures.get(eventNature.LIST).get(this.props.field.nature_id);
      const event_field = this.props.event.fields.get(nature.event_field);
      if(!event_field) return;
      const requiredColor = event_field.required ? "#f44336" : "#ccc";
      const nullableColor = event_field.allow_none ? "#ccc" : "#2196f3";
      return (
        <div>
          <h6 className="m-0"> Properties: </h6>
          <span className="text-muted">List of: </span>
          <span className="mouse-pointer" data-feather="x-circle" style={{height: "1.2em", color: nullableColor}}></span>
          <span className="mouse-pointer" data-feather="alert-triangle" style={{height: "1.2em", color: requiredColor}}></span>
          {event_field.name} <span style={{color: "#3eac34"}}>[{event_field.nature}]</span>
          <hr/>
        </div>
      );
    }
  }

  render() {
    const field = this.props.field;
    if(!field){
      return null;
    }
    let properties = this.getProperties();
    return (
      <div className="popover bs-popover-right" role="tooltip" style={this.props.style}>
          <div className="arrow" style={{top: "34px"}}></div>
            <h3 className="popover-header">{field.name}</h3>
          <div className="popover-body">
            <div className="row">
              <div className="col-md-3">
                {field.nature == "Nested" || field == this.props.event
                ? <div className="list-group">
                    <button className="btn btn-success my-1" onClick={() => this.props.toggleShowAddField(field)}>Create</button>
                    <button className="btn btn-primary my-1" onClick={() => this.props.toggleShowExcluded()}>
                      {this.props.showExcluded ? "Hide Excluded" : "Show Excluded"}
                    </button>
                  </div>
                : null}
                {field != this.props.event
                ? <div className="list-group">
                    <button className="btn btn-primary my-1" onClick={() => this.props.toggleShowAddField(field)}>Update</button>
                    <button className="btn btn-danger my-1" onClick={() => this.props.deleteEventField(field)}>Delete</button>
                  </div>
                : null}
                </div>
              <div className="col-md-9">
                {properties}
              <h6>Description: </h6>
              <div dangerouslySetInnerHTML={{__html: field.description}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default EventFieldPopup;