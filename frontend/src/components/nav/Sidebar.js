import React, { Component } from "react";

class Sidebar extends Component {
	constructor(props){
		super(props);
		this.state = {
				events: this.props.events
		}
  }

  onClick(e, item){
    e.preventDefault();
    this.props.onClick(item);
  }
  
  render() {
    return (
      <nav id="sidebarMenu" className="col-md-4 col-lg-3 d-md-block bg-light sidebar collapse">
        <div className="sidebar-sticky">
          <ul className="nav flex-column">
          <li className="nav-item">
            <div className="nav-link active">
              <div className="d-flex justify-content-between align-content-center">
                <h3>Events</h3>
                <a href="" aria-label="Add a new event" onClick={(e) => this.onClick(e, "create")}>
                  <span className="mouse-pointer" data-feather="plus-circle" style={{width: 40, height: 40}}></span>
                </a>
              </div>
            </div>
          </li>
          {(() => {
            const events = [];
            this.props.events.forEach(item => events.push(
              <li className="nav-item" key={item.name}>
                <div className={
                  `nav-link ${this.props.showEvent && this.props.showEvent.id == item.id ? "active" : ""} 
                  ${this.props.editEvent && this.props.editEvent.id == item.id ? "alert-warning" : ""}`}
                  onClick={(e) => this.onClick(e, item)}>
                <span data-feather="file"></span> {item.name}
                </div>
              </li>
            ))
            return events
          })()}
          </ul>
        </div>
      </nav>
    );
  }
}

export default Sidebar;