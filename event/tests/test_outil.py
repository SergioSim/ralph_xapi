"""Common functions used in test"""
from marshmallow import Schema, fields

EXCLUDED_KEYS = ["_creation_index", "__module__", "opts", "parent"]

def get_items(expected, actual):
    """Returns dict_items for dict or class"""
    if isinstance(expected, dict):
        return expected.items()
    return expected.__dict__.items()

def get_dict(actual):
    """Returns the dictionary or class.__dict__"""
    if isinstance(actual, dict):
        return actual
    return actual.__dict__

def compare_fields(expected, actual):
    """Check that 2 objects have the same fields"""
    expected_keys = set(get_dict(expected).keys())
    actual_keys = set(get_dict(actual).keys())
    assert expected_keys == actual_keys
    for attr, value in get_items(expected, actual):
        print("attr", attr, type(value))
        if attr in EXCLUDED_KEYS:
            continue
        if isinstance(value, list):
            continue
        if isinstance(value, (fields.Field, Schema, dict)):
            compare_fields(value, get_dict(actual)[attr])
            continue
        assert value == get_dict(actual)[attr]
