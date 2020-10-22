import { Editor } from "@tinymce/tinymce-react";
import React, { Component } from "react";
import { getCookie } from '../../utils';
import { alertService } from '../../services/alert.service';
import EventGraph from './EventGraph';
import CreateEventField from "./CreateEventField";

class Event extends Component {
  constructor(props){
    super(props);
    this.state = {
      edit: false,
      event: this.props.event,
      showAddField: false,
      fields: new Map()
    }
  }

  save(e){
    e.preventDefault();
    const csrftoken = getCookie('csrftoken');
    fetch('api/event/' + this.state.event.id, {
      credentials: 'include',
      method: 'PUT',
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        name: this.state.event.name,
        description: this.state.event.description,
        parent: this.state.event.parent
      })
    }).then(response => {
      this.statusCode = response.status;
      return response.json();
    }).then(event => {
      event.fields = this.state.event.fields;
      if(this.statusCode != 200){
        alertService.error(JSON.stringify(event));
        return;
      }
      this.setState({edit: false});
      this.props.updateEvent(event);
      this.props.updateEditEvent(null, () => {}, event);
      alertService.success('Event: "' + event.name + '" updated with success!');
    })
  }

  delete(e){
    e.preventDefault();
    const csrftoken = getCookie('csrftoken');
    const eventName = this.props.event.name;
    if(!confirm("Are you sure to want to delete Event:" + eventName)){
      return;
    };
    fetch('api/event/' + this.props.event.id, {
      credentials: 'include',
      method: 'DELETE',
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      }
    }).then(response => {
      if(response.status != 204){
        alertService.error(response.status);
        return;
      }
      this.props.handleSidebarClick(null);
      this.props.deleteEvent(this.props.event.id);
      this.props.fetchEvents();
      alertService.success('Event: "' + eventName + '" deleted with success!');
    });
  }

  edit(){
    this.props.updateEditEvent(this.props.event, () => {
      this.setState((state, props) => ({edit: true, event: props.event}));
    });
  }

  handleNameChange(event) {
    const name = event.target.value;
    this.setState((state, props) => {
      let event = this.state.event;
      event.name = name;
      return {event}
    })
  }

  handleParentChange(event) {
    const parent = event.target.value;
    this.setState((state, props) => {
      let event = this.state.event;
      event.parent = parent;
      return {event}
    })
    this.setState({parent: event.target.value});
  }

  handleEditorChange(content, editor){
    this.setState((state, props) => {
      let event = this.state.event;
      event.description = content;
      return {event}
    })
  }

  toggleShowAddField(){
    this.setState((state, props) => ({showAddField: !state.showAddField}));
  }

  updateField(field, calback = () => {}){
    this.setState(
      (state, props) => {
        state.event.fields.set(field.id, field)
        return {event: state.event}
      },
      calback
    );
  }

  render() {
    const showEdit = !(this.state.edit && this.props.editEvent && this.props.editEvent.id == this.props.event.id);
    const parent = this.props.event.parent &&
                  this.props.events.get(this.props.event.parent);
    return (
      <div className="container mt-4">
        <section className="mb-4">
        <div className="jumbotron-heading d-flex justify-content-between align-content-center mb-2">
          <h2 className="form-inline">
            <span className="text-muted">Event: &nbsp;</span>
            <span hidden={!showEdit}> {this.props.event.name}</span>
            <div hidden={showEdit} className="form-inline">
              <div className="col-sm-10">
                <input type="text" className="form-control" id="name"
                aria-describedby="nameHelp" value={this.state.event.name}
                onChange={(event) => this.handleNameChange(event)} required/>
              </div>
            </div>  
          </h2>
          <div className="d-flex">
            {this.props.editEvent && this.props.editEvent.id == this.props.event.id
            ? <button className="btn btn-primary mx-2" onClick={(e)=> this.save(e)}>Save</button>
            : <button className="btn btn-primary mx-2" onClick={()=> this.edit()}>Edit</button>
            }
            <button className="btn btn-danger mx-2" onClick={(e)=> this.delete(e)}>Delete</button>
          </div>
        </div>
        <span className="h5 text-muted from-inline">
          Parent: &nbsp;
          <a hidden={!showEdit || !parent} href="#" onClick={(e) => {e.preventDefault();this.props.handleSidebarClick(parent)}}>
              {parent && parent.name}
          </a>
          <span hidden={!showEdit || parent}>No parent</span>
          <div hidden={showEdit} className="form-group form-check">
          <select className="custom-select" size="5" 
              value={this.state.event.parent ? this.state.event.parent : ''} onChange={(event) => this.handleParentChange(event)}>
            <option value="">No Parent</option>
            {(() => {
              const events = [];
              this.props.events.forEach(event => events.push(
                <option key={event.id} value={event.id}>{event.name}</option>
              ));
              return events;
            })()}
          </select>
          </div>
          </span>
        </section>
        <div hidden={!showEdit} dangerouslySetInnerHTML={{__html: this.props.event.description}}></div>
        <div hidden={showEdit} className="form-group form-check">
          <label htmlFor="name">Description:</label>
          <Editor
            value={this.state.event.description}
            init={{height: 500}}
            onEditorChange={(content, editor) => this.handleEditorChange(content, editor)}
            textareaName='description'
          />
        </div>
        <hr/>
        <div className="d-flex justify-content-between align-content-center">
        <h2 className="text-muted">Event Graph</h2>
        <button hidden={showEdit} className="btn btn-primary mx-2" onClick={()=> this.toggleShowAddField()}>Add Field</button>
        </div>
        <CreateEventField
          hidden={this.state.showAddField}
          event={this.state.event}
          toggleShowAddField={() => this.toggleShowAddField()}
          updateField={(field) => this.updateField(field)}/>
        <EventGraph event={showEdit ? this.props.event: this.state.event} events={this.props.events} />

      </div>
    );
  }
}

export default Event;