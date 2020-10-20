import React, { Component } from "react";
import MyGraph from "./MyGraph";
import Nav from "./nav/Nav";
import Sidebar from "./nav/Sidebar";
import './App.css';
import Event from "./event/Event";
import CreateEvent from "./event/CreateEvent";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      loaded: false,
      placeholder: "Loading",
      main: null
    };
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
        this.setState(() => {
          return {
            events,
            loaded: true
          };
        });
      });
  }

  handleSidebarClick(event){
    if(event == "create"){
      this.setState({main: <CreateEvent events={this.state.events} appendEvent={(event) => {this.appendEvent(event)}}/>})
      return;
    }
    event ? this.setState({main: <Event event={event}/>}) : this.setState({main: null})
  }

  appendEvent(event){
  
    this.setState((state, props) => ({
      events: [...state.events, event]
    }))
  }

  render() {
    return (
      <div>
        <Nav/>
        <div className="container-fluid">
          <div className="row">
            <Sidebar events={this.state.events} onClick={(event) => this.handleSidebarClick(event)}/>
            <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-md-4">
              {this.state.main && this.state.main}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;