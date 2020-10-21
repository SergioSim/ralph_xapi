import React, { Component } from "react";
import { getCookie } from '../../utils';
import { alertService } from '../../services/alert.service';

class Event extends Component {
  constructor(props){
    super(props);
    this.state = {
      edit: false,
      event: this.props.event
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

  edit(){
    this.props.updateEditEvent(this.props.event, () => {
      this.setState((state, props) => ({edit: true, event: props.event}));
    });
  }

  handleNameChange(event) {
    console.log(event);
    this.setState((state, props) => ({event: state.event.set("name", event.target.value)}));
  }

  render() {
    const showEdit = !(this.state.edit && this.props.editEvent && this.props.editEvent.id == this.props.event.id);
    const parent = this.props.event.parent &&
                  this.props.events.get(this.props.event.parent);
    return (
      <div className="container mt-4">
          <section className="mb-4">
          <div className="jumbotron-heading d-flex justify-content-between align-content-center mb-2">
            <div className="form-group row" hidden={showEdit}>
              <form>
                  <label htmlFor="name" className="col-sm-2 col-form-label">Event:</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" id="name"
                    aria-describedby="nameHelp" value={this.state.event.name}
                    onChange={(event) => this.handleNameChange(event)} required/>
                  </div>
                </form>
              </div>
            <h2 hidden={!showEdit}><span className="text-muted">Event: </span> {this.props.event.name} </h2>              
            <div className="d-flex">
              {this.props.editEvent && this.props.editEvent.id == this.props.event.id
              ? <button className="btn btn-primary mx-2" onClick={(e)=> this.save(e)}>Save</button>
              : <button className="btn btn-primary mx-2" onClick={()=> this.edit()}>Edit</button>
              }  
            </div>
          </div>
          <span className="h5 text-muted">
            Parent: {parent 
            ? <a href="#" onClick={(e) => {e.preventDefault();this.props.handleSidebarClick(parent)}}>
                {parent.name}
              </a>
            : <span>No parent</span>}
          </span>
          </section>
          <div dangerouslySetInnerHTML={{__html: this.props.event.description}}></div>
      </div>
    );
  }
}

export default Event;