"""Test for SchemaGen"""
import pytest
from marshmallow import Schema, fields, validates,validates_schema, ValidationError

from ..models import (
    DictNature,
    Event,
    EventField,
    IntegerNature,
    IPv4Nature,
    ListNature,
    NestedNature,
    UrlNature,
    SchemaValidate
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
NESTED_NATURE = NestedNature(id=1, event=EVENT1)


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
        NESTED_NATURE.save()


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
COMMON_PROPS2 = {"event_id": 1, "name": "field2", "description": "desc"}
COMMON_PROPS3 = {"event_id": 2, "name": "field2", "description": "desc"}
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
    schema = SchemaGen.gen_schema_from_record(EVENT)
    assert issubclass(schema, Schema)


def test_schema_name_should_be_alphanumeric():
    """
    Given a database record of a schema
    Which name field contains non alphanumeric characters
    We should skip the non alphanumeric characters
    """
    # Escaping spaces
    event = Event(name=" name ", description="description")
    schema = SchemaGen.gen_schema_from_record(event)
    assert schema.__name__ == "name"
    # Escaping symbols
    event = Event(name="name@!,.123name?`~", description="description")
    schema = SchemaGen.gen_schema_from_record(event)
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
        event_field.save()
        # Generate the Schema
        schema = SchemaGen.gen_schema_from_record(EVENT)
        compare_fields(
            expected=field_type(**expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )
        event_field.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_simple_field_exluded(input_props, expected_props):
    """
    Given a database record of a schema with one simple EventField
    with excluded property set to true
    We should generate the corresponding marshmallow schema
    Without this field
    """
    for nature, _ in SIMPLE_TYPES.items():
        # Create excluded EventField
        event_field = EventField(**COMMON_PROPS, **input_props, excluded=True, nature=nature)
        event_field.save()
        # Generate the Schema
        schema = SchemaGen.gen_schema_from_record(EVENT)
        # Expected Schema
        class eventname(Schema):
            pass

        compare_fields(expected=eventname, actual=schema)
        event_field.delete()


@pytest.mark.parametrize("input_props,expected_props,related_value", RELATED_FIELD_TEST)
def test_one_related_field(input_props, expected_props, related_value):
    """
    Given a database record of a schema with one Integer, Url or Ipv4 EventField
    We should generate the corresponding marshmallow schema
    """
    for nature, field_type_tuple in SIMPLE_RELATED_TYPES_WITH_KEY.items():
        # Create EventField
        event_field = EventField(**COMMON_PROPS, **input_props, nature=nature)
        event_field.save()
        # Generate the Schema
        expected_props[field_type_tuple[1]] = related_value
        schema = SchemaGen.gen_schema_from_record(EVENT)
        compare_fields(
            expected=field_type_tuple[0](**expected_props),
            actual=schema.__dict__["_declared_fields"]["field"],
        )
        del expected_props[field_type_tuple[1]]
        event_field.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_list_field_with_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one List EventField
    We should generate the corresponding marshmallow schema
    """
    for list_input_props, list_expected_props in SIMPLE_FIELD_TEST:
        for nature, field_type in SIMPLE_TYPES.items():
            # Persist Simple Event Field in DB
            simple_field = EventField(
                id=3, **COMMON_PROPS1, **input_props, nature=nature, excluded=True
            )
            simple_field.save()
            list_nature = ListNature(id=1, event_field_id=3)
            list_nature.save()
            # Create List EventField
            event_field = EventField(
                **COMMON_PROPS, **list_input_props, nature=NATURES.LIST, nature_id=1
            )
            event_field.save()
            # Generate the Schema
            schema = SchemaGen.gen_schema_from_record(EVENT)
            ### START EXPECTED EVENT SCHEMA

            class eventname(Schema):
                field = fields.List(field_type(**expected_props), **list_expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=eventname, actual=schema)
            simple_field.delete()
            list_nature.delete()
            event_field.delete()


@pytest.mark.parametrize("input_props,expected_props,related_value", RELATED_FIELD_TEST)
def test_one_list_field_with_related_field(input_props, expected_props, related_value):
    """
    Given a database record of a schema with one Integer, Url or Ipv4 EventField
    We should generate the corresponding marshmallow schema
    """
    for list_input_props, list_expected_props in SIMPLE_FIELD_TEST:
        for nature, field_type_tuple in SIMPLE_RELATED_TYPES_WITH_KEY.items():
            # Persist Simple Event Field in DB
            related_field = EventField(
                id=3, **COMMON_PROPS1, **input_props, nature=nature, excluded=True
            )
            related_field.save()
            list_nature = ListNature(id=1, event_field_id=3)
            list_nature.save()
            # Create EventField
            event_field = EventField(
                **COMMON_PROPS, **list_input_props, nature=NATURES.LIST, nature_id=1
            )
            event_field.save()
            # Generate the Schema
            expected_props = expected_props.copy()
            expected_props[field_type_tuple[1]] = related_value
            schema = SchemaGen.gen_schema_from_record(EVENT)
            ### START EXPECTED EVENT SCHEMA

            class eventname(Schema):
                field = fields.List(field_type_tuple[0](**expected_props), **list_expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=eventname, actual=schema)
            del expected_props[field_type_tuple[1]]
            related_field.delete()
            list_nature.delete()
            event_field.delete()


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
            key_field = EventField(
                id=3, **COMMON_PROPS1, **key_props, nature=key_nature, excluded=True
            )
            key_field.save()
            for value_nature, value_type in SIMPLE_TYPES.items():
                for value_props, value_expected_props in SIMPLE_FIELD_TEST:
                    value_field = EventField(
                        id=4, **COMMON_PROPS2, **value_props, nature=value_nature, excluded=True
                    )
                    value_field.save()
                    dict_nature = DictNature(id=2, keys_id=3, values_id=4)
                    dict_nature.save()
                    # Create List EventField
                    event_field = EventField(
                        **COMMON_PROPS, **input_props, nature=NATURES.DICT, nature_id=2
                    )
                    event_field.save()
                    # Generate the Schema
                    schema = SchemaGen.gen_schema_from_record(EVENT)
                    ### START EXPECTED EVENT SCHEMA

                    class eventname(Schema):
                        field = fields.Dict(
                            keys=key_type(**key_expected_props),
                            values=value_type(**value_expected_props),
                            **expected_props
                        )

                    ### END EXPECTED EVENT SCHEMA
                    compare_fields(expected=eventname, actual=schema)

                    dict_nature.delete()
                    event_field.delete()

@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_nested_field_with_empty(input_props, expected_props):
    """
    Given a database record of a schema with one Nested EventField
    We should generate the corresponding marshmallow schema
    """
    # Create EventField
    event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.NESTED, nature_id=1)
    event_field.save()
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
    ### START EXPECTED EVENT SCHEMA
    class eventname1(Schema):
        pass

    class eventname(Schema):
        field = fields.Nested(eventname1(), **expected_props)
    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=eventname, actual=schema)
    event_field.delete()

@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_nested_field_with_simple_field(input_props, expected_props):
    """
    Given a database record of a schema with one Nested EventField
    We should generate the corresponding marshmallow schema
    """
    EventField.objects.filter(event_id=1).delete()
    for field_props, expected_field_props in SIMPLE_FIELD_TEST:
        for nature, field_type in SIMPLE_TYPES.items():
            # Create EventField in EVENT1
            event_field = EventField(**COMMON_PROPS3, **field_props, nature=nature)
            event_field.save()
            # Generate the Schema of EVENT nesting EVENT1
            nested_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.NESTED, nature_id=1)
            nested_field.save()
            schema = SchemaGen.gen_schema_from_record(EVENT)
            ### START EXPECTED EVENT SCHEMA
            class eventname1(Schema):
                field2 = field_type(**expected_field_props)

            class eventname(Schema):
                field = fields.Nested(eventname1(), **expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=eventname, actual=schema)
            event_field.delete()
            nested_field.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_nested_field_with_related_field(input_props, expected_props):
    """
    Given a database record of a schema with one Nested EventField
    Which contains an Event with one related field
    We should generate the corresponding marshmallow schema
    """
    EventField.objects.filter(event_id=1).delete()
    for field_props, expected_field_props, related_value in RELATED_FIELD_TEST:
        for nature, field_type_tuple in SIMPLE_RELATED_TYPES_WITH_KEY.items():
            # Create EventField in EVENT1
            event_field = EventField(**COMMON_PROPS3, **field_props, nature=nature)
            event_field.save()
            # Generate the Schema of EVENT nesting EVENT1
            nested_field = EventField(
                **COMMON_PROPS, **input_props, nature=NATURES.NESTED, nature_id=1
            )
            nested_field.save()
            # Generate the Schema
            schema = SchemaGen.gen_schema_from_record(EVENT)
            expected_field_props = expected_field_props.copy()
            expected_field_props[field_type_tuple[1]] = related_value
            ### START EXPECTED EVENT SCHEMA
            class eventname1(Schema):
                field2 = field_type_tuple[0](**expected_field_props)

            class eventname(Schema):
                field = fields.Nested(eventname1(), **expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=eventname, actual=schema)
            del expected_field_props[field_type_tuple[1]]
            event_field.delete()
            nested_field.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_string_field_with_validate(input_props, expected_props):
    """
    Given a database record of a schema with one string EventField
    With validate property set
    We should generate the corresponding marshmallow schema
    With the corresponding validation function
    """
    # Create EventField
    event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.STRING)
    event_field.validate = """if field == 'raise':
            raise ValidationError('Error')"""
    event_field.save()
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
    ### START EXPECTED EVENT SCHEMA
    class eventname(Schema):
        field = fields.String(**expected_props)

        @validates("field")
        def validate_field(self, field):
            if field == 'raise':
                raise ValidationError('Error')

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=eventname, actual=schema)
    for schema_obj in [eventname(), schema()]:
        with pytest.raises(ValidationError) as err:
            schema_obj.load({"field": "raise"})
        assert err.value.messages["field"][0] == "Error"
        try:
            schema_obj.load({"field": "dont raise"})
        except ValidationError:
            pytest.fail("Schould not raise exception!")
    event_field.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_string_field_with_empty_schema_validation(input_props, expected_props):
    """
    Given a database record of a schema with one String EventField
    With a related empty SchemaValidate record
    We should generate the corresponding marshmallow schema
    With the corresponding schema_validate function
    """
     # Create EventField
    event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.STRING)
    event_field.save()
    # Create SchemaValidate
    schema_validate = SchemaValidate(event=EVENT, name="field")
    schema_validate.save()
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
     ### START EXPECTED EVENT SCHEMA
    class eventname(Schema):
        field = fields.String(**expected_props)

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=eventname, actual=schema)
    event_field.delete()
    schema_validate.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_string_field_with_schema_validation(input_props, expected_props):
    """
    Given a database record of a schema with one String EventField
    With a related SchemaValidate record
    We should generate the corresponding marshmallow schema
    With the corresponding schema_validate function
    """
     # Create EventField
    event_field = EventField(**COMMON_PROPS, **input_props, nature=NATURES.STRING)
    event_field.save()
    # Create SchemaValidate
    schema_validate = SchemaValidate(event=EVENT, name="field")
    schema_validate.validate="""if data['field'] == 'raise':
        raise ValidationError('Error')"""
    schema_validate.save()
    schema_validate.event_fields.add(event_field)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
     ### START EXPECTED EVENT SCHEMA
    class eventname(Schema):
        field = fields.String(**expected_props)

        @validates_schema
        def validate_schema_field(self, data, **kwargs):
            if data['field'] == 'raise':
                raise ValidationError('Error')

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=eventname, actual=schema)
    for schema_obj in [eventname(), schema()]:
        with pytest.raises(ValidationError) as err:
            schema_obj.load({"field": "raise"})
        assert err.value.messages['_schema'][0] == "Error"
        try:
            schema_obj.load({"field": "dont raise"})
        except ValidationError:
            pytest.fail("Schould not raise exception!")
    schema_validate.delete()
    event_field.delete()