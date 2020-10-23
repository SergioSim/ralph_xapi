"""Test for SchemaGen"""
import pytest
from marshmallow import Schema, fields

from ..models import Event, EventField, IntegerNature
from ..schema_gen import SchemaGen
from .test_outil import compare_fields

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name

EVENT = Event(id=1, name="eventname", description="desc")
INTEGER_NATURE0 = IntegerNature(id=1, strict=False)
INTEGER_NATURE1 = IntegerNature(id=2, strict=True)


@pytest.fixture()
def django_db_setup(django_db_setup, django_db_blocker):
    """Populating the DB"""
    # pylint: disable=redefined-outer-name,unused-argument
    with django_db_blocker.unblock():
        EVENT.save()
        INTEGER_NATURE0.save()
        INTEGER_NATURE1.save()


# test data
NATURES = EventField.EventNature

SIMPLE_TYPES = {}
SIMPLE_TYPES[NATURES.FIELD] = fields.Field
SIMPLE_TYPES[NATURES.STRING] = fields.String
SIMPLE_TYPES[NATURES.UUID] = fields.UUID
SIMPLE_TYPES[NATURES.BOOLEAN] = fields.Boolean
SIMPLE_TYPES[NATURES.DATETIME] = fields.DateTime
SIMPLE_TYPES[NATURES.URL] = fields.Url
SIMPLE_TYPES[NATURES.EMAIL] = fields.Email

RELATED_TYPES = {}
RELATED_TYPES[NATURES.NESTED] = fields.Nested
RELATED_TYPES[NATURES.DICT] = fields.Dict
RELATED_TYPES[NATURES.LIST] = fields.List
RELATED_TYPES[NATURES.INTEGER] = fields.Integer
RELATED_TYPES[NATURES.URL] = fields.Url
RELATED_TYPES[NATURES.IPV4] = fields.IPv4

COMMON_PROPS = {"event_id": 1, "name": "field", "description": "desc"}
BOOLEAN_PROPS0 = {"required": True, "allow_none": False}
BOOLEAN_PROPS1 = {"required": False, "allow_none": True}
INTEGER_PROPS0 = {"nature_id": 1}
INTEGER_PROPS1 = {"nature_id": 2}


def test_get_class_from_event_nature():
    """
    get_class_from_event_nature method should return the right classes
    """
    for nature, field_type in {**SIMPLE_TYPES, **RELATED_TYPES}.items():
        assert field_type == SchemaGen.get_class_from_event_nature(nature)


def test_schema_object_should_inherit_marshmallow_schema():
    """
    Given a database record of a schema
    We create an object that inherits marshmallow.Schema
    """
    schema = SchemaGen.gen_schema_from_record(EVENT, None)
    assert issubclass(schema, Schema)


def test_schema_name_should_be_alphanumeric():
    """
    Given a database record of a schema
    Which name field contains non alphanumeric characters
    We should skip the non alphanumeric characters
    """
    # Escaping spaces
    event = Event(name=" name ", description="description")
    schema = SchemaGen.gen_schema_from_record(event, None)
    assert schema.__name__ == "name"
    # Escaping symbols
    event = Event(name="name@!,.123name?`~", description="description")
    schema = SchemaGen.gen_schema_from_record(event, None)
    assert schema.__name__ == "name123name"


@pytest.mark.parametrize(
    "input_props,expected_props",
    [({}, BOOLEAN_PROPS0), (BOOLEAN_PROPS1, BOOLEAN_PROPS1)],
)
def test_schema_with_one_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one simple EventField
    We should generate the corresponding marshmallow schema
    """
    for nature, field_type in SIMPLE_TYPES.items():
        # Create EventField
        event_field = EventField(**COMMON_PROPS, **input_props, nature=nature)
        # Generate the Schema
        schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
        compare_fields(
            expected=field_type(**expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )


@pytest.mark.parametrize(
    "input_props,expected_props",
    [
        ({}, {**BOOLEAN_PROPS0, "strict": True}),
        (BOOLEAN_PROPS1, {**BOOLEAN_PROPS1, "strict": True}),
        (INTEGER_PROPS0, {**BOOLEAN_PROPS0, "strict": False}),
        (INTEGER_PROPS1, {**BOOLEAN_PROPS0, "strict": True}),
        ({**INTEGER_PROPS0, **BOOLEAN_PROPS0}, {**BOOLEAN_PROPS0, "strict": False}),
        ({**INTEGER_PROPS1, **BOOLEAN_PROPS1}, {**BOOLEAN_PROPS1, "strict": True}),
    ],
)
def test_schema_with_one_integer_field(input_props, expected_props):
    """
    Given a database record of a schema with one Integer EventField
    We should generate the corresponding marshmallow schema
    """
    # Create EventField
    event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.INTEGER)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
    compare_fields(
        expected=fields.Integer(**expected_props),
        actual=schema.__dict__["_declared_fields"]["field"],
    )
