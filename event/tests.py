"""Test event"""

import datetime
import inspect

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from marshmallow import Schema, fields

from .models import Event, EventField
from .schema_gen import SchemaGen
from . import test_outil


class EventModelTests(TestCase):
    """Test event model"""

    def test_event_should_not_have_empty_name(self):
        """
        creating an event with emtpy name may not be allowed
        """
        with self.assertRaises(ValidationError):
            event = Event(name="", description="description")
            event.save()


class SchemaGenTests(TestCase):
    """Test Schema generation from database data"""

    @classmethod
    def setUpTestData(cls):
        """Set up data for the whole TestCase"""
        cls.event = Event.objects.update_or_create(name="eventname", description="description")[0]
        cls.common_props = {
            "event_id": cls.event.id,
            "name": "field",
            "description": "description",
        }
        cls.boolean_props = {"required": False, "allow_none": True}
        cls.simple_types = {}
        cls.simple_types[EventField.EventNature.FIELD] = fields.Field
        cls.simple_types[EventField.EventNature.STRING] = fields.String
        cls.simple_types[EventField.EventNature.UUID] = fields.UUID
        cls.simple_types[EventField.EventNature.BOOLEAN] = fields.Boolean
        cls.simple_types[EventField.EventNature.DATETIME] = fields.DateTime
        cls.simple_types[EventField.EventNature.URL] = fields.Url
        cls.simple_types[EventField.EventNature.EMAIL] = fields.Email

    def test_get_class_from_event_nature(self):
        """
        get_class_from_event_nature method should return the right classes
        """
        for nature, field_type in self.simple_types.items():
            self.assertEqual(field_type, SchemaGen.get_class_from_event_nature(nature))
        self.assertEqual(fields.Nested, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.NESTED))
        self.assertEqual(fields.Dict, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.DICT))
        self.assertEqual(fields.List, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.LIST))
        self.assertEqual(fields.Integer, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.INTEGER))
        self.assertEqual(fields.IPv4, SchemaGen.get_class_from_event_nature(
            EventField.EventNature.IPV4))

    def test_schema_object_should_inherit_marshmallow_schema(self):
        """
        Given a database record of a schema
        We create an object that inherits marshmallow.Schema
        """
        schema = SchemaGen.gen_schema_from_record(self.event, None)
        self.assertTrue(issubclass(schema, Schema))

    def test_schema_name_should_be_alphanumeric(self):
        """
        Given a database record of a schema
        Which name field contains non alphanumeric characters
        We should skip the non alphanumeric characters
        """
        # Escaping spaces
        event = Event(name=" name ", description="description")
        schema = SchemaGen.gen_schema_from_record(event, None)
        self.assertTrue(schema.__name__ == "name")
        # Escaping symbols
        event = Event(name="name@!,.123name?`~", description="description")
        schema = SchemaGen.gen_schema_from_record(event, None)
        self.assertTrue(schema.__name__ == "name123name")

    def test_schema_with_one_string_field(self):
        """
        Given a database record of a schema with one string EventField
        We should generate the corresponding marshmallow schema
        """
        for nature, field_type in self.simple_types.items():
            # Create EventField
            event_field = EventField(**self.common_props, nature=nature)
            # Generate the Schema
            schema = SchemaGen.gen_schema_from_record(self.event, event_field)
            test_outil.compare_fields(
                self,
                expected=field_type(required=True, allow_none=False),
                actual=schema.__dict__['_declared_fields']["field"]
            )

    def test_schema_with_one_string_field_and_additional_properties(self):
        """
        Given a database record of a schema with one string EventField
        We should generate the corresponding marshmallow schema
        """
        for nature, field_type in self.simple_types.items():
            # Create EventField
            props = {**self.common_props, **self.boolean_props}
            event_field = EventField(**props, nature=nature)
            # Generate the Schema
            schema = SchemaGen.gen_schema_from_record(self.event, event_field)
            test_outil.compare_fields(
                self,
                expected=field_type(required=False, allow_none=True),
                actual=schema.__dict__['_declared_fields']["field"]
            )
