import React, { Component } from "react";
import Nav from "./nav/Nav";
import Sidebar from "./nav/Sidebar";
import './App.css';
import Event from "./event/Event";
import CreateEvent from "./event/CreateEvent";
import Alert from "./alert/Alert";
import { alertService } from '../services/alert.service';
import feather from 'feather-icons/dist/feather';
import Api from '../services/api.service'

class App extends Component {
  constructor(props) {
    super(props);
    this.api = new Api();
    this.state = {
      events: new Map(),
      showEvent: null,
      editEvent: null,
      placeholder: "Loading",
      main: null
    };
  }

  componentDidUpdate(){
    feather.replace();
  }

  componentDidMount() {
    this.fetchEvents()
  }

  fetchEvents(){
    this.api.fetchEvents().then(events => {
      this.fetchEventFields(events);
    });
  }

  fetchEventFields(iEvents){
    this.api.fetchEventFields().then(fields => {
      fields = fields.reduce(
        (acc, x) => acc.set(x.event, (acc.get(x.event) || new Map()).set(x.id, x)),
        new Map());
      const events = new Map(iEvents.map(x => {
        x.fields = fields.get(x.id) || new Map();
        return [x.id, x];
      }));
      this.setState({events})
    });        
  }

  handleSidebarClick(event){
    if(event == "create"){
      this.setState({
        main: <CreateEvent events={this.state.events} updateEvent={(event) => {this.updateEvent(event)}}/>,
        showEvent: null
      })
      return;
    }
    event 
      ? this.setState((state, props) => ({main: this.createMain(state, event), showEvent: event}))
      : this.setState({main: null})
  }

  createMain(state, event, editEvent=null){
    return <Event
    event={event}
    events={state.events}
    updateEvent={(event, callback) => {this.updateEvent(event, callback)}}
    editEvent={editEvent ? editEvent : state.editEvent}
    updateEditEvent={(editEvent, callback, event) => {this.updateEditEvent(editEvent, callback, event)}}
    handleSidebarClick={(event) => this.handleSidebarClick(event)}
    deleteEvent={(id) => this.deleteEvent(id)}
    fetchEvents={() => this.fetchEvents()}
    />
  }

  updateEvent(event, calback = () => {}){
    this.setState(
      (state, props) => ({events: state.events.set(event.id, event)}),
      calback
    );
  }

  deleteEvent(id){
    this.setState((state, props) => {
      state.events.delete(id);
      return {}
    })
  }

  updateEditEvent(editEvent, callback = () => {}, event=null){
    event = event ? event : editEvent;
    this.setState(
      (state, props) => ({editEvent, main: this.createMain(state, event, editEvent)}),
      callback
    );
  }

  render() {
    return (
      <div>
        <Nav onClick={(event) => this.handleSidebarClick(event)}/>
        <div className="container-fluid">
          <div className="row">
            <Sidebar 
              events={this.state.events} onClick={(event) => this.handleSidebarClick(event)}
              showEvent={this.state.showEvent} editEvent={this.state.editEvent}/>
            <main role="main" className="col-md-8 ml-sm-auto col-lg-9 px-md-4">
              <Alert />
              {this.state.main && this.state.main}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;