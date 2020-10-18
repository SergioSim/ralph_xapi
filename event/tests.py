"""Test event"""

import datetime

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from .models import Event


class EventModelTests(TestCase):
    """Test event model"""

    def test_event_should_not_have_empty_name(self):
        """
        creating an event with emtpy name may not be allowed
        """
        with self.assertRaises(ValidationError):
            event = Event(name="", description="description")
            event.save()

    def test_event_should_be_created(self):
        """
        creating a valid event
        """
        try:
            event = Event(name="not empty", description="description")
            event.save()
        except Exception as exception: # pylint: disable=broad-except
            self.fail("Unexpected exception %s" % exception)

class EvetIndexViewTests(TestCase):
    """Index page"""

    def test_no_events(self):
        """
        If no events exist, an appropriate message is displayed.
        """
        response = self.client.get(reverse('event:index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No events are available.")
        self.assertQuerysetEqual(response.context['events'], [])

    def test_saved_events_are_shown(self):
        """
        If we save events - we should see them
        """
        event1 = Event(name="event1", description="description")
        event1.save()
        event2 = Event(name="event2", description="description")
        event2.save()
        response = self.client.get(reverse('event:index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "event1")
        self.assertContains(response, "event2")
        self.assertQuerysetEqual(
            response.context['events'], ['<Event: 2-event1>', '<Event: 3-event2>']
        )

class EventShowView(TestCase):
    """Show page"""

    def test_inexisting_event_id_returns_404(self):
        """
        We return 404 when we don't find an event
        """
        response = self.client.get(reverse('event:show', args=(100,)))
        self.assertEqual(response.status_code, 404)
