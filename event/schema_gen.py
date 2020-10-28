"""Genrator of Marshmallow schemas from Database records"""
from ast import (FunctionDef, arg, arguments, parse, Module,
                Name, Call, Load, Str, fix_missing_locations)
import sys
from types import FunctionType, CodeType

from marshmallow import Schema, validates_schema
from marshmallow.decorators import set_hook

from .models import DictNature, EventField, ListNature, NestedNature, SchemaValidate
from .validation_scopes import func_scope

NATURE = EventField.EventNature

def nested_set(dic, keys, value):
    """Set the nested dict value by keys array"""
    for key in keys[:-1]:
        dic = dic.setdefault(key, {})
    dic[keys[-1]] = value

def nested_get(dic, keys):
    """Returns the nested value by keys array"""
    for key in keys[:-1]:
        dic = dic[key]
    return dic[keys[-1]]

class SchemaGen:
    """Creates Marshmallow schemas from Database records"""

    @staticmethod
    def gen_schema_from_record(record):
        """Returns single marshmallow schema for one record"""
        schema_props = {"__doc__": record.description}
        SchemaGen.put_fields(schema_props, record)
        SchemaGen.put_schema_validations(schema_props, record)
        schema_name = "".join([e for e in record.name if e.isalnum()])
        return type(schema_name, (Schema,), schema_props)

    @staticmethod
    def put_fields(schema_props, record):
        """Querry for all related EventFields and put them in schema_pops"""
        record_fields = EventField.objects.filter(event=record)
        for record_field in record_fields:
            SchemaGen.put_field(schema_props, record_field)

    @staticmethod
    def put_schema_validations(schema_props, record):
        """Querry for all related SchemaValidate and put them in schema_pops"""
        schema_validates = SchemaValidate.objects.filter(event=record)
        for schema_validate in schema_validates:
            SchemaGen.put_schema_validation(schema_props, schema_validate)

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
        paths = SchemaGen.get_events_from_schema(schema_validate)
        kwargs = SchemaGen.get_kwargs_from_paths(paths)
        name = schema_validate.name
        function_ast = FunctionDef(
            name=f"validate_schema_{name}",
            args=arguments(
                args=[], posonlyargs=[], kwonlyargs=kwargs, kw_defaults=[None]*len(kwargs),
                defaults=[]
            ),
            body=parse(schema_validate.validate).body,
            decorator_list=[],
        )
        func_code = SchemaGen.get_func_code_from_ast(function_ast)
        gen_func = FunctionType(func_code, func_scope)
        def gen_validate_schema(self, data, **kwargs):
            kwargs_dict = {}
            for path in paths:
                nested_set(kwargs_dict, path, nested_get(data, path))
            gen_func(**kwargs_dict)
        gen_validate_schema.__name__ = f"validate_schema_{name}"
        schema_props[f"validate_schema_{name}"] = validates_schema(gen_validate_schema)

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
            field_args.append(SchemaGen.gen_schema_from_record(nested_event)())
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

    @staticmethod
    def get_events_from_schema(schema_validate):
        """Returns a list of list representing the paths for relative events"""
        field_paths = []
        selected_fields = schema_validate.event_fields.all()
        event_fields = schema_validate.event.eventfield_set.all()
        SchemaGen.add_field_path(event_fields, selected_fields, field_paths, [])
        # field_paths.sort(key=lambda k: (len(k), "".join(k)))
        return field_paths

    @staticmethod
    def add_field_path(event_fields, selected_fields, field_paths, depth=None):
        """Adds recursively the absolute paths for the events"""
        if not depth:
            depth = []
        for event_field in event_fields:
            # print("EF:", event_field)
            if event_field in selected_fields:
                field_paths.append(depth + [event_field.name])
                selected_fields = selected_fields.exclude(id=event_field.id)
                if not selected_fields:
                    return
            if event_field.nature == NATURE.NESTED:
                depth.append(event_field.name)
                nested_event = NestedNature.objects.get(pk=event_field.nature_id).event
                nested_fields = nested_event.eventfield_set.all()
                SchemaGen.add_field_path(nested_fields, selected_fields, field_paths, depth)
                del depth[-1]

    @staticmethod
    def get_kwargs_from_paths(paths):
        """Returns a dict of ast arg objects representing kwargs"""
        kw_names = set([x[0] for x in paths])
        kwargs = []
        for kw_arg in kw_names:
            kwargs.append(arg(arg=kw_arg))
        return kwargs