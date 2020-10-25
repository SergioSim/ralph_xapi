"""Genrator of Marshmallow schemas from Database records"""
import sys

from marshmallow import Schema

from .models import DictNature, EventField, ListNature, NestedNature

NATURE = EventField.EventNature


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
        if not record_field or record_field.excluded:
            return
        schema_props[record_field.name] = SchemaGen.create_field(record_field)

    @staticmethod
    def create_field(record_field):
        """Returns a new marshmallow field from record_field"""
        field_props = SchemaGen.get_field_props(record_field)
        field_args = SchemaGen.get_field_args(record_field)
        field_class = SchemaGen.get_class_from_event_nature(record_field.nature)
        return field_class(*field_args, **field_props)

    @staticmethod
    def get_field_props(record_field):
        """Returns a dict with the properties needeed for a marshmallow field"""
        field_props = {}
        for field_prop in ["required", "allow_none", "validate"]:
            field_props[field_prop] = getattr(record_field, field_prop)
        SchemaGen.add_related_props(field_props, record_field)
        return field_props

    @staticmethod
    def get_field_args(record_field):
        """Returns a dict with the properties needeed for a marshmallow field"""
        # pylint: disable=no-member
        field_args = []
        if record_field.nature == NATURE.LIST:
            nested_field = ListNature.objects.get(pk=record_field.nature_id).event_field
            field_args.append(SchemaGen.create_field(nested_field))
        if record_field.nature == NATURE.NESTED:
            nested_event = NestedNature.objects.get(pk=record_field.nature_id).event
            nested_fields = EventField.objects.filter(event=nested_event).first()
            field_args.append(SchemaGen.gen_schema_from_record(nested_event, nested_fields)())
        return field_args

    @staticmethod
    def get_class_from_event_nature(nature):
        """Returns the corresponding class of an EventFieldNature"""
        return getattr(sys.modules["marshmallow.fields"], nature)

    @staticmethod
    def add_related_props(field_props, record_field):
        """Add props for fields having an additional nature_id relation"""
        func, args = SchemaGen.get_func_prop_name(record_field)
        if func:
            func(field_props, record_field, *args)

    @staticmethod
    def get_func_prop_name(record_field):
        """Returns the function and data by record_fields nature"""
        return {
            NATURE.INTEGER: (SchemaGen.add_boolean_props, ["strict"]),
            NATURE.URL: (SchemaGen.add_boolean_props, ["relative"]),
            NATURE.IPV4: (SchemaGen.add_boolean_props, ["exploded"]),
            NATURE.DICT: (SchemaGen.add_dict_props, []),
        }.get(record_field.nature, (None, None))

    @staticmethod
    def add_boolean_props(field_props, record_field, prop_name):
        """Add prop_name property if record_fields nature is Integer/Url/Ipv4"""
        # pylint: disable=no-member
        field_props[prop_name] = True
        nature_type = getattr(
            sys.modules["event.models"], record_field.nature + "Nature"
        )
        nature = nature_type.objects.filter(pk=record_field.nature_id).first()
        if nature:
            field_props[prop_name] = getattr(nature, prop_name)

    @staticmethod
    def add_dict_props(field_props, record_field):
        """Add keys/values to field_props for dict fields"""
        # pylint: disable=no-member
        field_props["keys"] = None
        field_props["values"] = None
        nature = DictNature.objects.filter(pk=record_field.nature_id).first()
        if nature and nature.keys:
            field_props["keys"] = SchemaGen.create_field(nature.keys)
        if nature and nature.values:
            field_props["values"] = SchemaGen.create_field(nature.values)
