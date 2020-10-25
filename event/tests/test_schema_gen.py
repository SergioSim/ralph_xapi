"""Test for SchemaGen"""
import pytest
from marshmallow import Schema, fields

from ..models import (
    DictNature,
    Event,
    EventField,
    IntegerNature,
    IPv4Nature,
    ListNature,
    NestedNature,
    UrlNature,
)
from ..schema_gen import SchemaGen
from .test_outil import compare_fields

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name

EVENT = Event(id=1, name="eventname", description="desc")
EVENT1 = Event(id=2, name="eventname1", description="desc")
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
        EVENT1.save()
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
COMMON_PROPS1 = {"event_id": 1, "name": "field1", "description": "desc"}
COMMON_PROPS2 = {"event_id": 2, "name": "field2", "description": "desc"}
BOOLEAN_PROPS0 = {"required": True, "allow_none": False}
BOOLEAN_PROPS1 = {"required": False, "allow_none": True}
RELATED_PROPS0 = {"nature_id": 1}
RELATED_PROPS1 = {"nature_id": 2}

SIMPLE_FIELD_TEST = [({}, BOOLEAN_PROPS0), (BOOLEAN_PROPS1, BOOLEAN_PROPS1)]
RELATED_FIELD_TEST = [
    ({}, BOOLEAN_PROPS0, True),
    (BOOLEAN_PROPS1, BOOLEAN_PROPS1, True),
    (RELATED_PROPS0, BOOLEAN_PROPS0, False),
    (RELATED_PROPS1, BOOLEAN_PROPS0, True),
    ({**RELATED_PROPS0, **BOOLEAN_PROPS0}, BOOLEAN_PROPS0, False),
    ({**RELATED_PROPS1, **BOOLEAN_PROPS1}, BOOLEAN_PROPS1, True),
]


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


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_simple_field(input_props, expected_props):
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


@pytest.mark.parametrize("input_props,expected_props,related_value", RELATED_FIELD_TEST)
def test_one_related_field(input_props, expected_props, related_value):
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


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_list_field_with_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one List EventField
    We should generate the corresponding marshmallow schema
    """
    for list_input_props, list_expected_props in SIMPLE_FIELD_TEST:
        for nature, field_type in SIMPLE_TYPES.items():
            # Persist Simple Event Field in DB
            EventField(id=3, **COMMON_PROPS, **input_props, nature=nature).save()
            ListNature(id=1, event_field_id=3).save()
            # Create List EventField
            event_field = EventField(
                **COMMON_PROPS, **list_input_props, nature=NATURES.LIST, nature_id=1
            )
            # Generate the Schema
            schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
            compare_fields(
                expected=fields.List(
                    field_type(**expected_props), **list_expected_props
                ),
                actual=schema.__dict__["_declared_fields"]["field"],
            )


@pytest.mark.parametrize("input_props,expected_props,related_value", RELATED_FIELD_TEST)
def test_one_list_field_with_related_field(input_props, expected_props, related_value):
    """
    Given a database record of a schema with one Integer, Url or Ipv4 EventField
    We should generate the corresponding marshmallow schema
    """
    for list_input_props, list_expected_props in SIMPLE_FIELD_TEST:
        for nature, field_type_tuple in SIMPLE_RELATED_TYPES_WITH_KEY.items():
            # Persist Simple Event Field in DB
            EventField(id=3, **COMMON_PROPS, **input_props, nature=nature).save()
            ListNature(id=1, event_field_id=3).save()
            # Create EventField
            event_field = EventField(
                **COMMON_PROPS, **list_input_props, nature=NATURES.LIST, nature_id=1
            )
            # Generate the Schema
            expected_props = expected_props.copy()
            expected_props[field_type_tuple[1]] = related_value
            schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
            compare_fields(
                expected=fields.List(
                    field_type_tuple[0](**expected_props), **list_expected_props
                ),
                actual=schema.__dict__["_declared_fields"]["field"],
            )
            del expected_props[field_type_tuple[1]]


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_dict_field_with_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one Dict EventField
    We should generate the corresponding marshmallow schema
    """
    # 2 * 6 * 2 * 6 * 2 = 288 tests \o/
    for key_nature, key_type in SIMPLE_TYPES.items():
        for key_props, key_expected_props in SIMPLE_FIELD_TEST:
            # Persist Simple Event Field in DB
            EventField(id=3, **COMMON_PROPS, **key_props, nature=key_nature).save()
            for value_nature, value_type in SIMPLE_TYPES.items():
                for value_props, value_expected_props in SIMPLE_FIELD_TEST:
                    EventField(
                        id=4, **COMMON_PROPS1, **value_props, nature=value_nature
                    ).save()
                    DictNature(id=2, keys_id=3, values_id=4).save()
                    # Create List EventField
                    event_field = EventField(
                        **COMMON_PROPS, **input_props, nature=NATURES.DICT, nature_id=2
                    )
                    # Generate the Schema
                    schema = SchemaGen.gen_schema_from_record(EVENT, event_field)
                    compare_fields(
                        expected=fields.Dict(
                            keys=key_type(**key_expected_props),
                            values=value_type(**value_expected_props),
                            **expected_props
                        ),
                        actual=schema.__dict__["_declared_fields"]["field"],
                    )

@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_nested_field_with_empty(input_props, expected_props):
    """
    Given a database record of a schema with one Dict EventField
    We should generate the corresponding marshmallow schema
    """
    # Create EventField
    NestedNature(id=1, event=EVENT1).save()
    event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.NESTED, nature_id=1)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT, event_field)

    class eventname1(Schema):
        """Expected Schema Class"""

    compare_fields(
        expected=fields.Nested(eventname1(), **expected_props),
        actual=schema.__dict__["_declared_fields"]["field"],
    )

@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_nested_field_with_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one Dict EventField
    We should generate the corresponding marshmallow schema
    """
    NestedNature(id=1, event=EVENT1).save()
    EventField.objects.filter(event_id=1).delete()
    for field_props, expected_field_props in SIMPLE_FIELD_TEST:
        for nature, field_type in SIMPLE_TYPES.items():
            # Create EventField in EVENT1
            event_field = EventField(**COMMON_PROPS2, **field_props, nature=nature)
            event_field.save()
            # Generate the Schema of EVENT nesting EVENT1
            nested_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.NESTED, nature_id=1)
            schema = SchemaGen.gen_schema_from_record(EVENT, nested_field)

            class eventname1(Schema):
                field2 = field_type(**expected_field_props)

            class eventname(Schema):
                field = fields.Nested(eventname1(), **expected_props)

            compare_fields(
                expected=eventname,
                actual=schema,
            )
            event_field.delete()