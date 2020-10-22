"""Test event"""

import datetime
import inspect

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from marshmallow import Schema, fields

from .models import Event, EventField
from .schema_gen import SchemaGen


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
        except Exception as exception:  # pylint: disable=broad-except
            self.fail("Unexpected exception %s" % exception)


class SchemaGenTests(TestCase):
    """Test Schema generation from database data"""

    def test_get_class_from_event_nature(self):
        """get_class_from_event_nature method should return the right classes"""
        self.assertEqual(fields.Field, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.FIELD))
        self.assertEqual(fields.Nested, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.NESTED))
        self.assertEqual(fields.Dict, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.DICT))
        self.assertEqual(fields.List, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.LIST))
        self.assertEqual(fields.String, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.STRING))
        self.assertEqual(fields.UUID, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.UUID))
        self.assertEqual(fields.Integer, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.INTEGER))
        self.assertEqual(fields.Boolean, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.BOOLEAN))
        self.assertEqual(fields.DateTime, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.DATETIME))
        self.assertEqual(fields.Url, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.URL))
        self.assertEqual(fields.Email, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.EMAIL))
        self.assertEqual(fields.IPv4, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.IPV4))

    def compare_fields(self, expected, actual):
        """Check that 2 objects have the same fields"""
        for attr, value in expected.__dict__.items():
            if attr == "_creation_index":
                continue
            self.assertEqual(value, actual.__dict__[attr])


    def test_schema_with_one_string_field(self):
        """
        Given a database record of a schema with one string EventField
        We should generate the corresponding marshmallow schema
        """
        # Create Event with it's EventField
        event = Event(name="single string", description="description")
        event_field = EventField(
            event_id=event.id,
            name="single_string_field",
            description="description",
            nature=EventField.EventNature.STRING,
        )
        # Generate the Schema
        schema = SchemaGen.gen_schema_from_record(event, event_field)
        # Check the Schema type
        self.assertTrue(issubclass(schema, Schema))
        # Check Schema name don't contain special chars
        self.assertTrue(schema.__name__ == "singlestring")
        self.compare_fields(
            expected=fields.String(required=True, allow_none=False, validate=None),
            actual=schema.__dict__['_declared_fields']['single_string_field']
        )
