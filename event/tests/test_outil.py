"""Common functions used in test"""
from marshmallow import fields


def compare_fields(expected, actual):
    """Check that 2 objects have the same fields"""
    for attr, value in expected.__dict__.items():
        if attr == "_creation_index":
            continue
        if isinstance(value, list):
            continue
        if isinstance(value, fields.Field):
            compare_fields(value, actual.__dict__[attr])
            continue
        assert value == actual.__dict__[attr]
