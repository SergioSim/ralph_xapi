import { Editor } from '@tinymce/tinymce-react';
import React, { Component } from "react";
import { alertService } from '../../services/alert.service';
import Api from '../../services/api.service';
import $ from 'jquery'
import { eventNature, booleanNatures, notSpecialNatures } from '../../common'
import CommonFieldCheckBox from './CommonFieldCheckBox'
import NatureSelect from './NatureSelect';
import EventFieldSelect from './EventFieldSelect';


class CreateEventField extends Component {
	constructor(props){
    super(props);
    this.api = new Api();
		this.state = {
      name: "",
      nature: eventNature.STRING,
      description: "",
      required: true,
      allow_none: false,
      excluded: false,
      exploded: true,
      relative: true,
      strict: true,
      event_field: "",
      keys: "",
      values: "",
      nested: "",
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount(){
    $('#createEventModal').modal({show: this.props.hidden});
    this.keydownListener = window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount(){
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  componentDidUpdate(){
    $('#createEventModal').modal({show: this.props.hidden})
  }

  handleKeyDown(ev) {
    if(this.props.hidden && ev.key == "Escape") {
      this.props.toggleShowAddField();
    }
  }

  handleEditorChange(content, editor){
    this.editor = editor;
    this.setState({description: content});
  }

  handleFieldChange(event, field_name) {
    this.setState({[field_name]: event.target.value});
  }

  toggleFieldChange(event, field_name){
    this.setState((state, props) => ({[field_name]: !state[field_name]}))
  }

  renderNatureFields(){
    
    if(notSpecialNatures.includes(this.state.nature)){
      return;
    }
    if(this.state.nature == eventNature.NESTED){
      return (
        <div className="form-group form-check">
          <select className="custom-select" size="5" value={this.state.nested}
                  onChange={(e) => this.handleFieldChange(e, "nested")}>
            <option disabled value=""> -- select an event -- </option>
            {(() => {
              const events = [];
              this.props.events.forEach(event => {
                if (event.id == this.props.event.id) {
                  return;
                }
                events.push(<option value={event.id} key={event.name + event.id}>{event.name}</option>)
              });
              return events;
            })()}
          </select>
        </div>
      )
    }
    if(this.state.nature == eventNature.DICT){
      return (
        <div>
          <EventFieldSelect
            event={this.props.event}
            natures={this.props.natures}
            label="Keys"
            name="keys"
            value={this.state.keys}
            required={false}
            handleFieldChange={(e) => this.handleFieldChange(e, "keys")}
          />
          <EventFieldSelect
            event={this.props.event}
            natures={this.props.natures}
            label="Values"
            name="values"
            value={this.state.values}
            required={false}
            handleFieldChange={(e) => this.handleFieldChange(e, "values")}
          />
        </div>
      )
    }
    if(this.state.nature == eventNature.LIST){
      return (
        <EventFieldSelect
          event={this.props.event}
          natures={this.props.natures}
          label="EventField"
          name="event_field"
          value={this.state.event_field}
          required={true}
          handleFieldChange={(e) => this.handleFieldChange(e, "event_field")}
        />
      )
    }
    if(this.state.nature == eventNature.INTEGER){
      return (
        <div className="form-group form-check">
          <input className="form-check-input" type="checkbox" name="strict" id="strict"
            checked={this.state.strict} onChange={(e)=> this.toggleFieldChange(e, "strict")}/>
          <label className="form-check-label" htmlFor="strict">
            Strict
          </label>
          <p>
            <small className="text-muted">
              If selected, only integer types are valid. Otherwise, any value castable to int is valid.
            </small>
          </p>
        </div>
      )
    }
    if(this.state.nature == eventNature.URL){
      return (
        <div className="form-group form-check">
          <input className="form-check-input" type="checkbox" name="relative" id="relative"
            checked={this.state.relative} onChange={(e)=> this.toggleFieldChange(e, "relative")}/>
          <label className="form-check-label" htmlFor="relative">
            Relative
          </label>
          <p>
            <small className="text-muted">
              Whether to allow relative URLs.
            </small>
          </p>
        </div>
      )
    }
    if(this.state.nature == eventNature.IPV4){
      return (
        <div className="form-group form-check">
          <input className="form-check-input" type="checkbox" name="exploded" id="exploded"
            checked={this.state.exploded} onChange={(e)=> this.toggleFieldChange(e, "exploded")}/>
          <label className="form-check-label" htmlFor="exploded">
            Exploded
          </label>
          <p>
            <small className="text-muted">
              If selected, serialize ip address in long form, ie. with groups consisting entirely of zeros included.
            </small>
          </p>
        </div>
      )
    }
  }

  submit(e) {
    e.preventDefault();
    const body = {
      event: this.props.event.id,
      name: this.state.name,
      nature: this.state.nature,
      description: this.state.description,
      required: this.state.required,
      allow_none: this.state.allow_none,
      excluded: this.state.excluded
    }
    if (notSpecialNatures.includes(this.state.nature)) {
      this.sendSubmit(body);
      return;
    }
    if (booleanNatures.includes(this.state.nature)) {
      let valueNameRoute = {
        [eventNature.IPV4]: {value: this.state.exploded, name: "exploded", route: (body) => this.api.createIpv4Nature(body)},
        [eventNature.URL]: {value: this.state.relative, name: "relative", route: (body) => this.api.createUrlNature(body)},
        [eventNature.INTEGER]: {value: this.state.strict, name: "strict", route: (body) => this.api.createIntegerNature(body)},
      }[this.state.nature];
      let natures = this.props.natures.get(this.state.nature);
      natures.forEach(function(value, key) {
        if (value[valueNameRoute.name] == valueNameRoute.value) {
          body.nature_id =  key;
        }
      });
      if(body.nature_id){
        this.sendSubmit(body);
        return;
      }
      valueNameRoute.route({[valueNameRoute.name]: valueNameRoute.value}).then(nature => {
        if(!nature) return;
        alertService.success('New ' + this.state.nature + ' Nature created: "' + nature.id + '"!');
        this.props.updateNature(this.state.nature, nature);
        body.nature_id = nature.id;
        this.sendSubmit(body);
      });
      return;
    }
    if (this.state.nature == eventNature.LIST) {
      this.api.createListNature({event_field: this.state.event_field}).then(nature => {
        if(!nature) return;
        alertService.success(`New ${this.state.nature} Nature created: ${nature.id}-${nature.event_field}!`);
        this.props.updateNature(this.state.nature, nature);
        body.nature_id = nature.id;
        this.sendSubmit(body);
      });
      return;
    }
    if (this.state.nature == eventNature.DICT) {
      this.api.createDictNature({keys: this.state.keys, values: this.state.values}).then(nature => {
        if(!nature) return;
        alertService.success(`New ${this.state.nature} Nature created: ${nature.id}-${nature.keys}-${nature.values}!`);
        this.props.updateNature(this.state.nature, nature);
        body.nature_id = nature.id;
        this.sendSubmit(body);
      });
      return;
    }
    if (this.state.nature == eventNature.NESTED) {
      this.api.createNestedNature({event: this.state.nested, exclude: ""}).then(nature => {
        if(!nature) return;
        alertService.success(`New ${this.state.nature} Nature created: ${nature.id}-${nature.event}!`);
        this.props.updateNature(this.state.nature, nature);
        body.nature_id = nature.id;
        this.sendSubmit(body);
      });
    }
  }

  sendSubmit(body){
    this.api.createEventField(body).then(eventField => {
      if (!eventField) return;
      alertService.success('EventField: "' + eventField.name + '" created with success!');
      document.getElementById("eventFieldCreateForm").reset();
      this.setState({
        name: "",
        nature: eventNature.STRING,
        description: "",
        required: true,
        allow_none: false,
        excluded: false,
        exploded: true,
        relative: true,
        strict: true,
        event_field: "",
        keys: "",
        values: "",
        nested: "",
      })
      this.editor.setContent('');
      this.props.updateField(eventField);
    });
  }

  render() {
    return (
      <div className="modal fade"
          id="createEventModal"
          data-backdrop="static"
          tabIndex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden={this.props.hidden ? "false": "true"}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">Create new Field for Event: <strong>{this.props.event.name}</strong></h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => this.props.toggleShowAddField()}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">

              <form id="eventFieldCreateForm" action="/" method="POST" onSubmit={(e) => this.submit(e)}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="name">Field name:</label>
                    <input type="text" name="name" id="name" className="form-control" value={this.state.name}
                            onChange={(event) => this.handleFieldChange(event, "name")} required/>
                  </div>
                  <NatureSelect
                    nature={this.state.nature}
                    natures={eventNature}
                    handleFieldChange={(e, name) => this.handleFieldChange(e, name)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="description">Description:</label>
                    <Editor
                      initialValue=""
                      init={{height: 300}}
                      onEditorChange={(content, editor) => this.handleEditorChange(content, editor)}
                      textareaName='description'
                    />
                  </div>
                  <div className="form-group col-md-6 mt-n1">
                    <CommonFieldCheckBox
                      required={this.state.required}
                      allow_none={this.state.allow_none}
                      excluded={this.state.excluded}
                      toggleFieldChange={(e, name) => this.toggleFieldChange(e, name)}
                    />
                    {this.renderNatureFields()}
                  </div>
                </div>
              </form>

            </div>
            <div className="modal-footer">
              <button type="submit" form="eventFieldCreateForm" className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateEventField;