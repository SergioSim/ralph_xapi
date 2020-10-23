"""Test event"""

from django.core.exceptions import ValidationError
from django.test import TestCase

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
