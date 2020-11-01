import { alertService } from './alert.service';
import { getCookie } from '../utils';

export default class Api {

  apiFetch(url, method = "GET", body = null, expectedStatus = null, isJSON = true) {
    const csrftoken = getCookie('csrftoken');
    const requestData = {
      credentials: 'include',
      method: method,
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
    }
    if(body){
      requestData.body = JSON.stringify(body);
    }
    return fetch(url, requestData).then(response => {
      if (response.status > 400) {
        alertService.error(`Some thing is wrong :( Status: ${response.status}`);
        return;
      }
      this.status = response.status;
      if(!isJSON){
        return response;
      }
      return response.json();
    }).then(JSONresponse => {
      if(expectedStatus && expectedStatus != this.status) {
        alertService.error(JSON.stringify(JSONresponse));
        return null;
      }
      return JSONresponse;
    });
  }

  fetchEvents() {
    return this.apiFetch('api/event/');
  }

  fetchEventFields() {
    return this.apiFetch('api/event/field/');
  }

  fetchIpv4Nature() {
    return this.apiFetch('api/event/nature/ipv4/');
  }

  fetchUrlNature() {
    return this.apiFetch('api/event/nature/url/');
  }

  fetchIntegerNature() {
    return this.apiFetch('api/event/nature/integer/');
  }

  createEvent(body, expectedStatus = 201) {
    return this.apiFetch('api/event/', "POST", body, expectedStatus);
  }

  createEventField(body, expectedStatus = 201) {
    return this.apiFetch('api/event/field/', "POST", body, expectedStatus);
  }

  createIpv4Nature(body, expectedStatus = 201) {
    return this.apiFetch('api/event/nature/ipv4/', "POST", body, expectedStatus);
  }

  createUrlNature(body, expectedStatus = 201) {
    return this.apiFetch('api/event/nature/url/', "POST", body, expectedStatus);
  }

  createIntegerNature(body, expectedStatus = 201) {
    return this.apiFetch('api/event/nature/integer/', "POST", body, expectedStatus);
  }

  updateEvent(eventId, body, expectedStatus = 200) {
    return this.apiFetch('api/event/' + eventId, "PUT", body, expectedStatus);
  }

  deleteEvent(eventId, expectedStatus = 204) {
    return this.apiFetch('api/event/' + eventId, "DELETE", null, expectedStatus, false);
  }



  deleteEventField(eventFieldId, expectedStatus = 204) {
    return this.apiFetch('api/event/field/' + eventFieldId, "DELETE", null, expectedStatus, false);
  }
}
