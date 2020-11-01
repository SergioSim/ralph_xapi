import React, { Component } from "react";
import { eventNature, booleanNatures } from '../../common'

class EventFieldSelect extends Component {
	constructor(props){
    super(props);
  }

  render() {
    const name = this.props.name;
    return (
      <div className="form-group form-check">
        <label className="form-check-label" htmlFor={name}>
          {this.props.label}
        </label>
        <select className="custom-select" size="5" value={this.props.value} id={name} name={name}
                  onChange={(e)=> this.props.handleFieldChange(e)} required={this.props.required}>
            {(() => {
              const fields = [<option disabled value="" key="0"> -- select a field -- </option>];
              this.props.event.fields.forEach(field => {
                if (!field.excluded) {
                  return;
                }
                const required = field.required ? "True" : "False";
                const nullable = field.allow_none ? "True" : "False";
                let additionalProps = `required: ${required}, nullable: ${nullable}`;
                if (booleanNatures.includes(field.nature)) {
                  let nature = this.props.natures.get(field.nature).get(field.nature_id);
                  nature.forEach(function(value, key) {
                    if(key == "id") return;
                    additionalProps += `, ${key}: ${value}`;
                  });
                }
                additionalProps = `{${additionalProps}}`;
                fields.push(
                  <option value={field.id} key={field.name + field.id}>
                    {field.name} [{field.nature}] {additionalProps}
                  </option>
                );
              });
              return fields;
            })()}
        </select>
      </div>
    )
  }
}

export default EventFieldSelect;