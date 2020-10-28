"""Common functions used in test"""
import inspect
from types import FunctionType

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
        print("attr", attr, type(value), value, get_dict(actual)[attr])
        if attr in EXCLUDED_KEYS:
            continue
        if isinstance(value, list):
            continue
        if isinstance(value, (fields.Field, Schema, dict)):
            compare_fields(value, get_dict(actual)[attr])
            continue
        if isinstance(value, FunctionType):
            exp_code = value.__code__
            act_code = get_dict(actual)[attr].__code__
            # function name should be equal
            # exp_code.co_name too strict?
            assert value.__name__ == get_dict(actual)[attr].__name__
            # function arguments count should be equal
            assert exp_code.co_argcount == act_code.co_argcount
            # function arguments names should be equal
            assert exp_code.co_varnames == act_code.co_varnames
            # function body byte-code should be equal
            assert exp_code.co_code == act_code.co_code
            continue
        assert value == get_dict(actual)[attr]
