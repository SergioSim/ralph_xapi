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
        console.log("Something went wrong!");
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

  fetchXAPIFields() {
    return this.apiFetch('api/event/xapi/');
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

  fetchListNature() {
    return this.apiFetch('api/event/nature/list/');
  }

  fetchDictNature() {
    return this.apiFetch('api/event/nature/dict/');
  }

  fetchNestedNature() {
    return this.apiFetch('api/event/nature/nested/');
  }

  fetchEventFieldTestByEventField(id) {
    return this.apiFetch('api/event/test/field/event/' + id);
  }

  createEvent(body, expectedStatus = 201) {
    return this.apiFetch('api/event/', "POST", body, expectedStatus);
  }

  createEventField(body, expectedStatus = 201) {
    return this.apiFetch('api/event/field/', "POST", body, expectedStatus);
  }

  createXAPIField(body, expectedStatus = 201) {
    return this.apiFetch('api/event/xapi/', "POST", body, expectedStatus);
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

  createListNature(body, expectedStatus = 201) {
    return this.apiFetch('api/event/nature/list/', "POST", body, expectedStatus);
  }

  createDictNature(body, expectedStatus = 201) {
    return this.apiFetch('api/event/nature/dict/', "POST", body, expectedStatus);
  }

  createNestedNature(body, expectedStatus = 201) {
    return this.apiFetch('api/event/nature/nested/', "POST", body, expectedStatus);
  }

  createEventFieldTest(body, expectedStatus = 201) {
    return this.apiFetch('api/event/test/field/', "POST", body, expectedStatus);
  }

  updateEvent(id, body, expectedStatus = 200) {
    return this.apiFetch('api/event/' + id, "PUT", body, expectedStatus);
  }

  updateEventField(id, body, expectedStatus = 200) {
    return this.apiFetch('api/event/field/' + id, "PATCH", body, expectedStatus);
  }

  updateXAPIField(id, body, expectedStatus = 200) {
    return this.apiFetch('api/event/xapi/' + id, "PATCH", body, expectedStatus);
  }

  updateEventFieldTest(id, body, expectedStatus = 200) {
    return this.apiFetch('api/event/test/field/' + id, "PUT", body, expectedStatus);
  }

  deleteEvent(id, expectedStatus = 204) {
    return this.apiFetch('api/event/' + id, "DELETE", null, expectedStatus, false);
  }

  deleteEventField(id, expectedStatus = 204) {
    return this.apiFetch('api/event/field/' + id, "DELETE", null, expectedStatus, false);
  }

  deleteXAPIField(id, expectedStatus = 204) {
    return this.apiFetch('api/event/xapi/' + id, "DELETE", null, expectedStatus, false);
  }

  deleteEventFieldTest(id, expectedStatus = 204) {
    return this.apiFetch('api/event/test/field/' + id, "DELETE", null, expectedStatus, false);
  }

  validateEventField(id, expectedStatus = 200 ) {
    return this.apiFetch('api/event/code/field/' + id, "POST", {}, expectedStatus);
  }
}
