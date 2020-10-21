import React, { Component } from "react";
import MyGraph from "./MyGraph";
import Nav from "./nav/Nav";
import Sidebar from "./nav/Sidebar";
import './App.css';
import Event from "./event/Event";
import CreateEvent from "./event/CreateEvent";
import Alert from "./alert/Alert";
import feather from 'feather-icons/dist/feather';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: new Map(),
      showEvent: null,
      editEvent: null,
      loaded: false,
      placeholder: "Loading",
      main: null
    };
  }

  componentDidUpdate(){
    feather.replace();
  }

  componentDidMount() {
    fetch("api/event")
      .then(response => {
        if (response.status > 400) {
          return this.setState(() => {
            return { placeholder: "Something went wrong!" };
          });
        }
        return response.json();
      })
      .then(events => {
        events = new Map(events.map(x => [x.id, x]));
        this.setState(() => {
          return {
            events,
            loaded: true
          };
        });
        feather.replace();
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

    />
  }

  updateEvent(event, calback = () => {}){
    this.setState(
      (state, props) => ({events: state.events.set(event.id, event)}),
      calback
    );
  }

  updateEditEvent(editEvent, callback = () => {}, event=null){
    event = event ? event : editEvent;
    this.setState({editEvent: editEvent}, () => {
      this.setState(
        (state, props) => ({editEvent: editEvent, main: this.createMain(state, event, editEvent)}),
        callback
      );
    });
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