"""Variable scopes used for validation functions"""

from marshmallow import validates, ValidationError


func_scope = {
    "__builtins__": __builtins__,
    "validates": validates,
    "ValidationError": ValidationError
}
