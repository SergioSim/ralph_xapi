"""Test for SchemaGen"""
import pytest
from marshmallow import Schema, fields

from ..models import Event, EventField, IntegerNature, IPv4Nature, UrlNature
from ..schema_gen import SchemaGen
from .test_outil import compare_fields

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name

EVENT = Event(id=1, name="eventname", description="desc")
INTEGER_NATURE0 = IntegerNature(id=1, strict=False)
INTEGER_NATURE1 = IntegerNature(id=2, strict=True)
URL_NATURE0 = UrlNature(id=1, relative=False)
URL_NATURE1 = UrlNature(id=2, relative=True)
IPV4_NATURE0 = IPv4Nature(id=1, exploded=False)
IPV4_NATURE1 = IPv4Nature(id=2, exploded=True)


@pytest.fixture()
def django_db_setup(django_db_setup, django_db_blocker):
    """Populating the DB"""
    # pylint: disable=redefined-outer-name,unused-argument
    with django_db_blocker.unblock():
        EVENT.save()
        INTEGER_NATURE0.save()
        INTEGER_NATURE1.save()
        URL_NATURE0.save()
        URL_NATURE1.save()
        IPV4_NATURE0.save()
        IPV4_NATURE1.save()


# test data
NATURES = EventField.EventNature

SIMPLE_TYPES = {
    NATURES.FIELD: fields.Field,
    NATURES.STRING: fields.String,
    NATURES.UUID: fields.UUID,
    NATURES.BOOLEAN: fields.Boolean,
    NATURES.DATETIME: fields.DateTime,
    NATURES.EMAIL: fields.Email,
}

SIMPLE_RELATED_TYPES_WITH_KEY = {
    NATURES.INTEGER: (fields.Integer, "strict"),
    NATURES.URL: (fields.Url, "relative"),
    NATURES.IPV4: (fields.IPv4, "exploded"),
}

RELATED_TYPES = {
    NATURES.NESTED: fields.Nested,
    NATURES.DICT: fields.Dict,
    NATURES.LIST: fields.List,
    NATURES.INTEGER: fields.Integer,
    NATURES.URL: fields.Url,
    NATURES.IPV4: fields.IPv4,
}

COMMON_PROPS = {"event_id": 1, "name": "field", "description": "desc"}
BOOLEAN_PROPS0 = {"required": True, "allow_none": False}
BOOLEAN_PROPS1 = {"required": False, "allow_none": True}
RELATED_PROPS0 = {"nature_id": 1}
RELATED_PROPS1 = {"nature_id": 2}


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
    [({}, BOOLEAN_PROPS0), (BOOLEAN_PROPS1, BOOLEAN_PROPS1)]
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
    "input_props,expected_props,related_value",
    [
        ({}, BOOLEAN_PROPS0, True),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, True),
        (RELATED_PROPS0, BOOLEAN_PROPS0, False),
        (RELATED_PROPS1, BOOLEAN_PROPS0, True),
        ({**RELATED_PROPS0, **BOOLEAN_PROPS0}, BOOLEAN_PROPS0, False),
        ({**RELATED_PROPS1, **BOOLEAN_PROPS1}, BOOLEAN_PROPS1, True),
    ]
)
def test_schema_with_one_integer_url_or_ipv4_field(input_props, expected_props, related_value):
    """
    Given a database record of a schema with one Integer, Url or Ipv4 EventField
    We should generate the corresponding marshmallow schema
    """
    for nature, field_type_tuple in SIMPLE_RELATED_TYPES_WITH_KEY.items():
        # Create EventField
        event_field = EventField(**COMMON_PROPS, **input_props, nature=nature)
        # Generate the Schema
        expected_props[field_type_tuple[1]] = related_value
        schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
        compare_fields(
            expected=field_type_tuple[0](**expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )
        del expected_props[field_type_tuple[1]]


@pytest.mark.parametrize(
    "input_props,expected_props,input_field_props,expected_field_props",
    [
        ({}, BOOLEAN_PROPS0, {}, BOOLEAN_PROPS0),
        ({}, BOOLEAN_PROPS0, BOOLEAN_PROPS1, BOOLEAN_PROPS1),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, {}, BOOLEAN_PROPS0),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, BOOLEAN_PROPS1, BOOLEAN_PROPS1),
    ]
)
def test_schema_with_one_list_field_with_a_simple_field(
    input_props, expected_props, input_field_props, expected_field_props
):
    """
    Given a database record of a schema with one List EventField
    We should generate the corresponding marshmallow schema
    """
    for nature, field_type in SIMPLE_TYPES.items():
        # Persist Simple Event Field in DB
        EventField(id=3, **COMMON_PROPS, **input_field_props, nature=nature).save()
        # Create List EventField
        event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.LIST, nature_id=3)
        # Generate the Schema
        schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
        compare_fields(
            expected=fields.List(field_type(**expected_field_props), **expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )


@pytest.mark.parametrize(
    "input_props,expected_props,input_field_props,expected_field_props,related_value",
    [
        ({}, BOOLEAN_PROPS0, {}, BOOLEAN_PROPS0, True),
        ({}, BOOLEAN_PROPS0, BOOLEAN_PROPS1, BOOLEAN_PROPS1, True),
        ({}, BOOLEAN_PROPS0, RELATED_PROPS0, BOOLEAN_PROPS0, False),
        ({}, BOOLEAN_PROPS0, RELATED_PROPS1, BOOLEAN_PROPS0, True),
        ({}, BOOLEAN_PROPS0, {**RELATED_PROPS0, **BOOLEAN_PROPS0}, BOOLEAN_PROPS0, False),
        ({}, BOOLEAN_PROPS0, {**RELATED_PROPS1, **BOOLEAN_PROPS1}, BOOLEAN_PROPS1, True),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, {}, BOOLEAN_PROPS0, True),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, BOOLEAN_PROPS1, BOOLEAN_PROPS1, True),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, RELATED_PROPS0, BOOLEAN_PROPS0, False),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, RELATED_PROPS1, BOOLEAN_PROPS0, True),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, {**RELATED_PROPS0, **BOOLEAN_PROPS0}, BOOLEAN_PROPS0, False),
        (BOOLEAN_PROPS1, BOOLEAN_PROPS1, {**RELATED_PROPS1, **BOOLEAN_PROPS1}, BOOLEAN_PROPS1, True),
    ]
)
def test_schema_with_one_list_field_with_one_integer_url_or_ipv4_field(
    input_props, expected_props, input_field_props, expected_field_props, related_value
):
    """
    Given a database record of a schema with one Integer, Url or Ipv4 EventField
    We should generate the corresponding marshmallow schema
    """
    for nature, field_type_tuple in SIMPLE_RELATED_TYPES_WITH_KEY.items():
        # Persist Simple Event Field in DB
        EventField(id=3, **COMMON_PROPS, **input_field_props, nature=nature).save()
        # Create EventField
        event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.LIST, nature_id=3)
        # Generate the Schema
        expected_field_props = expected_field_props.copy()
        expected_field_props[field_type_tuple[1]] = related_value
        schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
        compare_fields(
            expected=fields.List(field_type_tuple[0](**expected_field_props), **expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )
        del expected_field_props[field_type_tuple[1]]
