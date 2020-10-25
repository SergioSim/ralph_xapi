"""Common functions used in test"""
from marshmallow import Schema, fields


def compare_fields(expected, actual):
    """Check that 2 objects have the same fields"""
    for attr, value in expected.__dict__.items():
        print("attr", attr, type(value))
        if attr in ["_creation_index", "__module__", "opts", "parent"]:
            continue
        if isinstance(value, list):
            continue
        if isinstance(value, (fields.Field, Schema)):
            compare_fields(value, actual.__dict__[attr])
            continue
        if isinstance(value, dict):
            for dkey, dvalue in value.items():
                if dkey in ["_creation_index", "__module__", "opts"]:
                    continue
                if isinstance(dvalue, list):
                    continue
                if isinstance(dvalue, (fields.Field, Schema)):
                    if dkey == "parent":
                        continue
                    compare_fields(dvalue, actual.__dict__[attr][dkey])
                    continue
            continue
        assert value == actual.__dict__[attr]
