"""Test for SchemaGen"""
import pytest
from marshmallow import Schema, fields

from ..models import Event, EventField, IntegerNature
from ..schema_gen import SchemaGen
from . import test_outil

pytestmark = pytest.mark.django_db

event = Event(id=1, name="eventname", description="desc")
integer_nature0 = IntegerNature(id=1, strict=False)
integer_nature1 = IntegerNature(id=2, strict=True)

@pytest.fixture()
def django_db_setup(django_db_setup, django_db_blocker):
    """Populating the DB"""
    with django_db_blocker.unblock():
        event.save()
        integer_nature0.save()
        integer_nature1.save()

# test data
NATURES = EventField.EventNature

simple_types = {}
simple_types[NATURES.FIELD] = fields.Field
simple_types[NATURES.STRING] = fields.String
simple_types[NATURES.UUID] = fields.UUID
simple_types[NATURES.BOOLEAN] = fields.Boolean
simple_types[NATURES.DATETIME] = fields.DateTime
simple_types[NATURES.URL] = fields.Url
simple_types[NATURES.EMAIL] = fields.Email

related_types = {}
related_types[NATURES.NESTED] = fields.Nested
related_types[NATURES.DICT] = fields.Dict
related_types[NATURES.LIST] = fields.List
related_types[NATURES.INTEGER] = fields.Integer
related_types[NATURES.URL] = fields.Url
related_types[NATURES.IPV4] = fields.IPv4

common_props = {"event_id": 1, "name": "field", "description": "desc"}
boolean_props0 = {"required": True, "allow_none": False}
boolean_props1 = {"required": False, "allow_none": True}
integer_props0 = {"nature_id": 1}
integer_props1 = {"nature_id": 2}


def test_get_class_from_event_nature():
    """
    get_class_from_event_nature method should return the right classes
    """
    for nature, field_type in {**simple_types, **related_types}.items():
        assert field_type == SchemaGen.get_class_from_event_nature(nature)


def test_schema_object_should_inherit_marshmallow_schema():
    """
    Given a database record of a schema
    We create an object that inherits marshmallow.Schema
    """
    schema = SchemaGen.gen_schema_from_record(event, None)
    assert issubclass(schema, Schema)


def test_schema_name_should_be_alphanumeric():
    """
    Given a database record of a schema
    Which name field contains non alphanumeric characters
    We should skip the non alphanumeric characters
    """
    # Escaping spaces
    event_spaces = Event(name=" name ", description="description")
    schema = SchemaGen.gen_schema_from_record(event_spaces, None)
    assert schema.__name__ == "name"
    # Escaping symbols
    event_special = Event(name="name@!,.123name?`~", description="description")
    schema = SchemaGen.gen_schema_from_record(event_special, None)
    assert schema.__name__ == "name123name"


@pytest.mark.parametrize(
    "input_props,expected_props",
    [({}, boolean_props0), (boolean_props1, boolean_props1)],
)
def test_schema_with_one_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one simple EventField
    We should generate the corresponding marshmallow schema
    """
    for nature, field_type in simple_types.items():
        # Create EventField
        event_field = EventField(**common_props, **input_props, nature=nature)
        # Generate the Schema
        schema = SchemaGen.gen_schema_from_record(event, event_field)
        test_outil.compare_fields(
            expected=field_type(**expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )


@pytest.mark.parametrize("input_props,expected_props", [
    ({}, {**boolean_props0, "strict": True}),
    (boolean_props1, {**boolean_props1, "strict": True}),
    (integer_props0, {**boolean_props0, "strict": False}),
    (integer_props1, {**boolean_props0, "strict": True}),
    ({**integer_props0, **boolean_props0}, {**boolean_props0, "strict": False}),
    ({**integer_props1, **boolean_props1}, {**boolean_props1, "strict": True}),
])
def test_schema_with_one_integer_field(input_props, expected_props):
    """
    Given a database record of a schema with one Integer EventField
    We should generate the corresponding marshmallow schema
    """
    # Create EventField
    event_field = EventField(**common_props, **input_props, nature=NATURES.INTEGER)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(event, event_field)
    test_outil.compare_fields(
        expected=fields.Integer(**expected_props),
        actual=schema.__dict__['_declared_fields']["field"]
    )
