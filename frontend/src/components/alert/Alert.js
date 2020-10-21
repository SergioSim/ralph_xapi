import React, { Component } from "react";
import { alertService, alertType } from '../../services/alert.service';
import './Alert.css';

const defaultProps = {
  id: 'default-alert',
  fade: true
};

class Alert extends Component {
  constructor(props) {
    super(props)
    this.state = {
      alerts: []
    }
  }

  componentDidMount() {
    // subscribe to new alert notifications
    this.subscription = alertService.onAlert(this.props.id)
      .subscribe(alert => {
        // clear alerts when an empty alert is received
        if (!alert.message) {
          this.setState({ alerts: [] });
          return;
        }

        // add alert to array
        this.setState({ alerts: [...this.state.alerts, alert] });

        // auto close alert if required
        if (alert.autoClose) {
          setTimeout(() => this.removeAlert(alert), 3000);
        }
      });
  }

  componentWillUnmount() {
    // unsubscribe & unlisten to avoid memory leaks
    this.subscription.unsubscribe();
  }

  removeAlert(alert) {
    if (this.props.fade) {
        // fade out alert
        const alertWithFade = { ...alert, fade: true };
        this.setState((state, props) => ({ alerts: this.state.alerts.map(x => x === alert ? alertWithFade : x) }));

        // remove alert after faded out
        setTimeout(() => {
            this.setState({ alerts: this.state.alerts.filter(x => x !== alertWithFade) })
        }, 250);
    } else {
        // remove alert
        this.setState({ alerts: this.state.alerts.filter(x => x !== alert) })
    }
  }

  cssClasses(alert) {
      if (!alert) return;

      const classes = ['alert', 'alert-dismissable'];
              
      const alertTypeClass = {
          [alertType.success]: 'alert-success',
          [alertType.error]: 'alert-danger',
          [alertType.info]: 'alert-info',
          [alertType.warning]: 'alert-warning'
      }

      classes.push(alertTypeClass[alert.type]);

      if (alert.fade) {
          classes.push('fade');
      }

      return classes.join(' ');
  }

  render() {
    const { alerts } = this.state;
    if (!alerts.length) return null;
    return (
        <div className="Alert m-3">
            {alerts.map((alert, index) =>
                <div key={index} className={this.cssClasses(alert)}>
                    <span dangerouslySetInnerHTML={{__html: alert.message}}></span>
                    <a className="ml-2 my-auto" href="#" onClick={() => this.removeAlert(alert)}>&times;</a>
                </div>
            )}
        </div>
    );
  }
}

Alert.defaultProps = defaultProps;
export default Alert;