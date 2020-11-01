import React, { Component } from "react";
import { eventNature, booleanNatures} from '../../common';

class EventFieldPopup extends Component {
  constructor(props) {
    super(props);
  }

  getProperties() {
    if (!booleanNatures.includes(this.props.field.nature)) {
      return null;
    }
    console.log(this.props.field.nature, eventNature.IPV4, this.props.field.nature == eventNature.IPV4);
    if (this.props.field.nature == eventNature.IPV4) {
      const ipv4Nature = this.props.natures.get(eventNature.IPV4);
      console.log(ipv4Nature);
      const nature = ipv4Nature.get(this.props.field.nature_id);
      console.log("nature", nature, "id", this.props.field.nature_id);
      return <div>
      <h6 className="m-0"> Properties: </h6>
      Exploded: <span className="badge badge-secondary">{nature.exploded ? "True" : "False"}</span>
      <hr/>
    </div>
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
                <div className="list-group">
                  {field.nature == "Nested" || field == this.props.event
                  ? <button className="btn btn-success my-1" onClick={() => this.props.toggleShowAddField(field)}>Create</button>
                  : null}
                  {field != this.props.event
                  ? <button className="btn btn-primary my-1" onClick={() => this.props.toggleShowAddField(field)}>Update</button>
                  : null}
                  {field != this.props.event
                  ? <button className="btn btn-danger my-1" onClick={() => this.props.deleteEventField(field)}>Delete</button>
                  : null}
                </div>
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