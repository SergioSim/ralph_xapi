"""Genrator of Marshmallow schemas from Database records"""
import sys

from marshmallow import Schema, fields

from .models import EventField, IntegerNature

class SchemaGen:
    """Creates Marshmallow schemas from Database records"""

    @staticmethod
    def gen_schema_from_record(record, record_field):
        """Returns single marshmallow schema for one record"""
        schema_props = {}
        SchemaGen.put_field(schema_props, record_field)
        schema_name = "".join([e for e in record.name if e.isalnum()])
        return type(schema_name, (Schema,), schema_props)

    @staticmethod
    def put_field(schema_props, record_field):
        """Insert a marshmallow field in schema_props dict"""
        if not record_field:
            return
        field_props = SchemaGen.get_field_props(record_field)
        # print("RECORD FIELD NAME", record_field.name)
        schema_props[record_field.name] = SchemaGen.get_class_from_event_nature(
            record_field.nature
        )(**field_props)

    @staticmethod
    def get_field_props(record_field):
        """Returns a dict with the properties needeed for a marshmallow field"""
        field_props = {}
        for field_prop in ["required", "allow_none", "validate"]:
            field_props[field_prop] = getattr(record_field, field_prop)
        SchemaGen.add_related_props(field_props, record_field)
        return field_props

    @staticmethod
    def get_class_from_event_nature(nature):
        """Returns the corresponding class of an EventFieldNature"""
        return getattr(sys.modules["marshmallow.fields"], nature)

    @staticmethod
    def add_related_props(field_props, record_field):
        """Add props for fields having an additional nature_id relation"""
        SchemaGen.add_integer_props(field_props, record_field)

    @staticmethod
    def add_integer_props(field_props, record_field):
        """Add strict property if record_fields nature is Integer"""
        if record_field.nature != EventField.EventNature.INTEGER:
            return
        field_props["strict"] = True
        inature = IntegerNature.objects.filter(pk=record_field.nature_id).first()
        if inature:
            field_props["strict"] = inature.strict
