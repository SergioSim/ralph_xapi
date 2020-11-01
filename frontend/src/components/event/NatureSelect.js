import React, { Component } from "react";
import { eventNature } from '../../common'


class NatureSelect extends Component {
	constructor(props){
    super(props);
  }

  render() {
    return (
      <div className="form-group col-md-6">
        <label htmlFor="nature">Field type</label>
        <select name="nature" className="custom-select" value={this.props.nature}
                onChange={(e) => this.props.handleFieldChange(e, "nature")} required>
          {(() => {
            const natures = [];
            Object.values(eventNature).forEach(val => natures.push(
              <option value={val} key={"nature" + val}>{val}</option>
            ));
            return natures;
          })()}
        </select>
      </div>
    )
  }
}

export default NatureSelect;