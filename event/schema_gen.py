"""Genrator of Marshmallow schemas from Database records"""
import sys

from marshmallow import Schema, fields

class SchemaGen:
    """Creates Marshmallow schemas from Database records"""

    @staticmethod
    def get_class_from_event_nature(nature):
        """Returns the corresponding class of an EventFieldNature"""
        return getattr(sys.modules["marshmallow.fields"], nature)
    


    @staticmethod
    def gen_schema_from_record(record, record_field):
        """Returns single marshmallow schema for one record"""

        field_props = {}
        for field_prop in ['required', 'allow_none', 'validate']:
            field_props[field_prop] = getattr(record_field, field_prop)

        schema_props = {}
        schema_name = ''.join([e for e in record.name if e.isalnum()])
        schema_props[record_field.name] = SchemaGen.get_class_from_event_nature(
            record_field.nature)(**field_props)
        return type(schema_name, (Schema,), schema_props)
