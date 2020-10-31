import { Editor } from "@tinymce/tinymce-react";
import React, { Component } from "react";
import { alertService } from '../../services/alert.service';
import Api from '../../services/api.service'
import EventGraph from './EventGraph';
import CreateEventField from "./CreateEventField";

class Event extends Component {
  constructor(props){
    super(props);
    this.api = new Api();
    this.state = {
      edit: false,
      event: this.props.event,
      showAddField: false,
    }
  }

  save(e){
    e.preventDefault();
    const body = {
      name: this.state.event.name,
      description: this.state.event.description,
      parent: this.state.event.parent
    }
    this.api.updateEvent(this.state.event.id, body).then(event => {
      if(!event) return;
      this.setState({edit: false});
      event.fields = this.props.event.fields;
      this.updateEvent(event);
      this.props.updateEditEvent(null, () => {}, event);
      alertService.success('Event: "' + event.name + '" updated with success!');
    });
  }

  delete(e){
    e.preventDefault();
    const eventName = this.props.event.name;
    if(!confirm("Are you sure to want to delete Event:" + eventName)){
      return;
    };
    this.api.deleteEvent(this.props.event.id).then(response => {
      if(!response) return;
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

  toggleShowAddField(event = null){
    this.setState((state, props) => ({showAddField: !state.showAddField}));
  }

  updateEvent(event, callback){
    this.props.updateEvent(event, () => {
      this.setState((state, props) => {
        ({event: props.event})
      }, callback);
    });
  }

  updateField(field){
    const event = this.props.event;
    event.fields.set(field.id, field);
    this.updateEvent(event);
  }

  deleteEventField(field, callback = () => {}){
    if(!confirm("Are you sure to want to delete the EventField:" + field.name)){
      return;
    };
    this.api.deleteEventField(field.id).then(response => {
      if(!response) return;
      const event = this.props.event;
      event.fields.delete(field.id);
      this.updateEvent(event, callback);
      alertService.success('EventField: "' + field.name + '" deleted with success!');
    });
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
          <h2 className="text-muted">Event Graph:</h2>
        </div>
        <CreateEventField
          hidden={this.state.showAddField}
          event={this.props.event}
          toggleShowAddField={(event) => this.toggleShowAddField(event)}
          updateField={(field) => this.updateField(field)}
        />
        <EventGraph
          event={this.props.event}
          events={this.props.events}
          toggleShowAddField={(event) => this.toggleShowAddField(event)}
          deleteEventField={(field, callback) => this.deleteEventField(field, callback)}
        />
      </div>
    );
  }
}

export default Event;