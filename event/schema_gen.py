"""Genrator of Marshmallow schemas from Database records"""
from ast import (FunctionDef, arg, arguments, parse, Module,
                Name, Call, Load, Str, fix_missing_locations)
import sys
from types import FunctionType, CodeType

from marshmallow import Schema, validates_schema
from marshmallow.decorators import set_hook

from .models import DictNature, EventField, ListNature, NestedNature
from .validation_scopes import func_scope

NATURE = EventField.EventNature


class SchemaGen:
    """Creates Marshmallow schemas from Database records"""

    @staticmethod
    def gen_schema_from_record(record, record_field, schema_validate=None):
        """Returns single marshmallow schema for one record"""
        schema_props = {}
        SchemaGen.put_field(schema_props, record_field)
        SchemaGen.put_schema_validation(schema_props, schema_validate)
        schema_name = "".join([e for e in record.name if e.isalnum()])
        return type(schema_name, (Schema,), schema_props)

    @staticmethod
    def put_field(schema_props, record_field):
        """Insert a marshmallow field in schema_props dict"""
        if not record_field or record_field.excluded:
            return
        name = record_field.name
        schema_props[name] = SchemaGen.create_field(record_field)
        if record_field.validate:
            schema_props[f"validate_{name}"] = SchemaGen.create_validate_func(record_field)

    @staticmethod
    def put_schema_validation(schema_props, schema_validate):
        """Insert a schema_validation function in schema_props dict"""
        if not schema_validate or not schema_validate.validate:
            return
        name = schema_validate.name
        function_ast = FunctionDef(
            name=f"validate_schema_{name}",
            args=arguments(
                args=[arg(arg="self"), arg(arg="data")], kwarg=arg(arg="kwargs"),
                posonlyargs=[], kwonlyargs=[], kw_defaults=[], defaults=[]
            ),
            body=parse(schema_validate.validate).body,
            decorator_list=[],
        )
        func_code = SchemaGen.get_func_code_from_ast(function_ast)
        schema_props[f"validate_schema_{name}"] = validates_schema(FunctionType(func_code, func_scope))

    @staticmethod
    def get_func_code_from_ast(function_ast):
        """Returns func_code object corresponding to function_ast"""
        module_ast = Module(body=[function_ast], type_ignores=[])
        fix_missing_locations(module_ast)
        module_code = compile(module_ast, "<not_a_file>", "exec")
        return [c for c in module_code.co_consts if isinstance(c, CodeType)][0]

    @staticmethod
    def create_field(record_field):
        """Returns a new marshmallow field from record_field"""
        field_props = SchemaGen.get_field_props(record_field)
        field_args = SchemaGen.get_field_args(record_field)
        field_class = SchemaGen.get_class_from_event_nature(record_field.nature)
        return field_class(*field_args, **field_props)

    @staticmethod
    def create_validate_func(record_field):
        """Returns the validation function from record_field"""
        name = record_field.name
        function_ast = FunctionDef(
            name=f"validate_{name}",
            args=arguments(
                args=[arg(arg="self"), arg(arg=name)],
                posonlyargs=[], kwonlyargs=[], kw_defaults=[], defaults=[]
            ),
            body=parse(record_field.validate).body,
            decorator_list=[],
        )
        func_code = SchemaGen.get_func_code_from_ast(function_ast)
        return set_hook(FunctionType(func_code, func_scope), "validates", field_name=name)

    @staticmethod
    def get_field_props(record_field):
        """Returns a dict with the properties needeed for a marshmallow field"""
        field_props = {}
        for field_prop in ["required", "allow_none"]:
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
