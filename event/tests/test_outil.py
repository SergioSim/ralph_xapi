"""Common functions used in test"""


def compare_fields(expected, actual):
    """Check that 2 objects have the same fields"""
    for attr, value in expected.__dict__.items():
        if attr == "_creation_index":
            continue
        if isinstance(value, list):
            continue
        print(attr)
        assert value == actual.__dict__[attr]
