"""Test for SchemaGen"""
import pytest
from marshmallow import Schema, fields, post_dump, validates, validates_schema, ValidationError

from ..models import (
    DictNature,
    Event,
    EventField,
    IntegerNature,
    IPv4Nature,
    ListNature,
    NestedNature,
    UrlNature,
    SchemaValidate,
    XAPIField
)
from ..schema_gen import SchemaGen, nested_set, nested_get
from .test_outil import compare_fields

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name

EVENT = Event(id=1, name="Eventname", description="desc")
EVENT1 = Event(id=2, name="Eventname1", description="desc")
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
XAPI_NATURES = XAPIField.XAPINature

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

class DB:
    """Create/Delete Database records"""

    saved = []

    def create_event(self, name="Eventname2", description="desc", parent=None):
        """Create one Event record"""
        return self.save(Event(name=name, description=description, parent=parent))

    def create_field(self, event=EVENT, name="field", **kwargs):
        """Create one EventField record"""
        ikwargs = {}
        ikwargs['nature'] = kwargs.get("nature", NATURES.STRING)
        ikwargs['nature_id'] = kwargs.get("nature_id", None)
        ikwargs['required'] = kwargs.get("required", True)
        ikwargs['allow_none'] = kwargs.get("allow_none", False)
        ikwargs['excluded'] = kwargs.get("excluded", False)
        ikwargs['description'] = kwargs.get("description", "desc")
        return self.save(EventField(event=event, name=name, **ikwargs))

    def create_xapi_field(self, event=EVENT, parent=None, name="field", **kwargs):
        """Create one XAPIField record"""
        ikwargs = {}
        ikwargs['nature'] = kwargs.get("nature", XAPI_NATURES.STRING)
        ikwargs['default'] = kwargs.get("default", None)
        ikwargs['description'] = kwargs.get("description", "desc")
        return self.save(XAPIField(event=event, parent=parent, name=name, **ikwargs))

    def create_schema_validate(self, event=EVENT, name="schema"):
        """Create one SchemaValidate record"""
        return self.save(SchemaValidate(event=event, name=name))

    def create_nested_nature(self, event=EVENT1, exclude=""):
        """Create one NestedNature record"""
        return self.save(NestedNature(event=event, exclude=exclude))

    def delete(self):
        """Delete all saved records"""
        for record in self.saved:
            if record.id:
                record.delete()
    
    def save(self, record):
        """Save the record and return it"""
        record.save()
        self.saved.append(record)
        return record

@pytest.fixture
def _db():
    """All Records created with db fixture will be deleted after each test"""
    db_obj = DB()
    yield db_obj
    db_obj.delete()

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
        class Eventname(Schema):
            """desc"""
            pass

        compare_fields(expected=Eventname, actual=schema)
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

            class Eventname(Schema):
                """desc"""
                field = fields.List(field_type(**expected_props), **list_expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=Eventname, actual=schema)
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

            class Eventname(Schema):
                """desc"""
                field = fields.List(field_type_tuple[0](**expected_props), **list_expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=Eventname, actual=schema)
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

                    class Eventname(Schema):
                        """desc"""
                        field = fields.Dict(
                            keys=key_type(**key_expected_props),
                            values=value_type(**value_expected_props),
                            **expected_props
                        )

                    ### END EXPECTED EVENT SCHEMA
                    compare_fields(expected=Eventname, actual=schema)

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
    class Eventname1(Schema):
        """desc"""
        pass

    class Eventname(Schema):
        """desc"""
        field = fields.Nested(Eventname1(), **expected_props)
    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=Eventname, actual=schema)
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
            class Eventname1(Schema):
                """desc"""
                field2 = field_type(**expected_field_props)

            class Eventname(Schema):
                """desc"""
                field = fields.Nested(Eventname1(), **expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=Eventname, actual=schema)
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
            class Eventname1(Schema):
                """desc"""
                field2 = field_type_tuple[0](**expected_field_props)

            class Eventname(Schema):
                """desc"""
                field = fields.Nested(Eventname1(), **expected_props)

            ### END EXPECTED EVENT SCHEMA
            compare_fields(expected=Eventname, actual=schema)
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
    class Eventname(Schema):
        """desc"""
        field = fields.String(**expected_props)

        @validates("field")
        def validate_field(self, field):
            if field == 'raise':
                raise ValidationError('Error')

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=Eventname, actual=schema)
    for schema_obj in [Eventname(), schema()]:
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
    class Eventname(Schema):
        """desc"""
        field = fields.String(**expected_props)

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=Eventname, actual=schema)
    event_field.delete()
    schema_validate.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_one_string_field_with_schema_validation(_db, input_props, expected_props):
    """
    Given a database record of a schema with one String EventField
    With a related SchemaValidate record
    We should generate the corresponding marshmallow schema
    With the corresponding schema_validate function
    """
     # Create EventField
    event_field = _db.create_field(**input_props, nature=NATURES.STRING)
    # Create SchemaValidate
    schema_validate = _db.create_schema_validate(name="one_field")
    schema_validate.validate = """if field == 'raise':
        raise ValidationError('Error')"""
    schema_validate.save()
    schema_validate.event_fields.add(event_field)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
    ### START EXPECTED EVENT SCHEMA
    paths = [["field"]]
    def func(field=None):
        if field == 'raise':
            raise ValidationError('Error')

    class Eventname(Schema):
        """desc"""
        field = fields.String(**expected_props)

        @validates_schema
        def validate_schema_one_field(self, data, **kwargs):
            kwargs_dict = {}
            for path in paths:
                nested_set(kwargs_dict, path, nested_get(data, path))
            func(**kwargs_dict)

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=Eventname, actual=schema)
    for schema_obj in [Eventname(), schema()]:
        with pytest.raises(ValidationError) as err:
            schema_obj.load({"field": "raise"})
        assert err.value.messages['_schema'][0] == "Error"
        try:
            schema_obj.load({"field": "dont raise"})
        except ValidationError:
            pytest.fail("Schould not raise exception!")
    schema_validate.delete()
    event_field.delete()


@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_multiple_string_field_with_schema_validation(_db, input_props, expected_props):
    """
    Given a database record of a schema with multiple String EventFields
    With a related SchemaValidate record
    We should generate the corresponding marshmallow schema
    With the corresponding schema_validate function
    """
    # Create EventField
    event_field = _db.create_field(name="field_1", **input_props)
    event_field1 = _db.create_field(name="field_2", **input_props)
    event_field2 = _db.create_field(name="field_3", **input_props)
    # Create SchemaValidate
    schema_validate = _db.create_schema_validate(name="field_1_2")
    schema_validate.validate = """if field_1 == 'raise':
        raise ValidationError('Error')
if field_2 == 'raise':
    raise ValidationError('Error')
try:
    field_3
except NameError:
    pass # OK
else:
    raise ValidationError('field_3 is defined!')
"""
    schema_validate.save()
    schema_validate.event_fields.add(event_field)
    schema_validate.event_fields.add(event_field1)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
    ### START EXPECTED EVENT SCHEMA
    paths = [["field_1"], ["field_2"]]
    def func(field_1=None, field_2=None):
        if field_1 == 'raise':
            raise ValidationError('Error')
        if field_2 == 'raise':
            raise ValidationError('Error')
        try:
            field_3
        except NameError:
            pass # OK
        else:
            raise ValidationError('field_3 is defined!')

    class Eventname(Schema):
        """desc"""
        field_1 = fields.String(**expected_props)
        field_2 = fields.String(**expected_props)
        field_3 = fields.String(**expected_props)

        @validates_schema
        def validate_schema_field_1_2(self, data, **kwargs):
            kwargs_dict = {}
            for path in paths:
                nested_set(kwargs_dict, path, nested_get(data, path))
            func(**kwargs_dict)

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=Eventname, actual=schema)
    for schema_obj in [Eventname(), schema()]:
        with pytest.raises(ValidationError) as err:
            schema_obj.load({"field_1": "raise", "field_2": "not-raise", "field_3": "raise"})
        assert err.value.messages['_schema'][0] == "Error"
        with pytest.raises(ValidationError) as err:
            schema_obj.load({"field_1": "not-raise", "field_2": "raise", "field_3": "raise"})
        assert err.value.messages['_schema'][0] == "Error"
        try:
            schema_obj.load({"field_1": "not-raise", "field_2": "not-raise", "field_3": "raise"})
        except ValidationError:
            pytest.fail("Schould not raise exception!")
    # Now we add field_3 to our validation function
    schema_validate.event_fields.add(event_field2)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
    with pytest.raises(ValidationError) as err:
        schema().load({"field_1": "not-raise", "field_2": "not-raise", "field_3": "raise"})
    assert err.value.messages['_schema'][0] == "field_3 is defined!"



@pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
def test_nested_string_field_with_schema_validation(_db, input_props, expected_props):
    """
    Given a database record of a schema with multiple nested String EventFields
    With a related SchemaValidate record
    We should generate the corresponding marshmallow schema
    With the corresponding schema_validate function
    """
    str_input_props = {**input_props, **{"nature": NATURES.STRING}}
    nest_input_props = {**input_props, **{"nature": NATURES.NESTED, "nature_id": 1}}
    # Create EventFields in EVENT1
    _db.create_field(event=EVENT1, name="field_1", **str_input_props)
    event_field2 = _db.create_field(event=EVENT1, name="field_2", **str_input_props)
    _db.create_field(event=EVENT1, name="field_3", **str_input_props)
    # Create EventFields in EVENT
    _db.create_field(event=EVENT, name="field_4", **str_input_props)
    event_field5 = _db.create_field(event=EVENT, name="field_5", **str_input_props)
    _db.create_field(event=EVENT, name="field_6", **str_input_props)
    # Create Nested Event Field
    _db.create_field(event=EVENT, name="nested", **nest_input_props)
    # Create SchemaValidate
    schema_validate = _db.create_schema_validate(name="nested_field")
    schema_validate.validate = """if field_5 == 'raise':
        raise ValidationError('Error')
if nested['field_2'] == 'raise':
    raise ValidationError('Error Nested')"""
    schema_validate.save()
    schema_validate.event_fields.add(event_field2)
    schema_validate.event_fields.add(event_field5)
    # Generate the Schema
    schema = SchemaGen.gen_schema_from_record(EVENT)
    ### START EXPECTED EVENT SCHEMA
    paths = [["field_5"], ['nested', 'field_2']]
    def func(field_5=None, nested=None):
        if field_5 == 'raise':
            raise ValidationError('Error')
        if nested['field_2'] == 'raise':
            raise ValidationError('Error Nested')

    class Eventname1(Schema):
        """desc"""
        field_1 = fields.String(**expected_props)
        field_2 = fields.String(**expected_props)
        field_3 = fields.String(**expected_props)

    class Eventname(Schema):
        """desc"""
        field_4 = fields.String(**expected_props)
        field_5 = fields.String(**expected_props)
        field_6 = fields.String(**expected_props)
        nested = fields.Nested(Eventname1(), **expected_props)

        @validates_schema
        def validate_schema_nested_field(self, data, **kwargs):
            kwargs_dict = {}
            for path in paths:
                nested_set(kwargs_dict, path, nested_get(data, path))
            func(**kwargs_dict)

    ### END EXPECTED EVENT SCHEMA
    compare_fields(expected=Eventname, actual=schema)
    for schema_obj in [Eventname(), schema()]:
        with pytest.raises(ValidationError) as err:
            schema_obj.load({
                "field_4": "not-raise",
                "field_5": "not-raise",
                "field_6": "not-raise",
                "nested": {
                    "field_1": "not-raise",
                    "field_2": "raise",
                    "field_3": "not-raise",
                }
            })
        assert err.value.messages['_schema'][0] == "Error Nested"
        with pytest.raises(ValidationError) as err:
            schema_obj.load({
                "field_4": "not-raise",
                "field_5": "raise",
                "field_6": "not-raise",
                "nested": {
                    "field_1": "not-raise",
                    "field_2": "not-raise",
                    "field_3": "not-raise",
                }
            })
        assert err.value.messages['_schema'][0] == "Error"
        try:
            schema_obj.load({
                "field_4": "not-raise",
                "field_5": "not-raise",
                "field_6": "not-raise",
                "nested": {
                    "field_1": "not-raise",
                    "field_2": "not-raise",
                    "field_3": "not-raise",
                }
            })
        except ValidationError:
            pytest.fail("Schould not raise exception!")


def test_schemagen_get_related_field_names_and_paths_validate(_db):
    """
    SchemaGen.get_related_field_names_and_paths should return
    an array of arrays representing the access paths for
    each related event
    """
    # Create EventField
    event_field1 = _db.create_field(name="field_1")
    # Create SchemaValidate
    schema_validate = _db.create_schema_validate()
    schema_validate.event_fields.add(event_field1)
    names, paths = SchemaGen.get_related_field_names_and_paths(schema_validate)
    assert paths == [["field_1"]]
    assert names == {"field_1"}
    # Add another event_field to event (Without adding it to the SchemaValidate)
    _db.create_field(name="field_not_validated")
    names, paths = SchemaGen.get_related_field_names_and_paths(schema_validate)
    assert paths == [["field_1"]]
    assert names == {"field_1"}
    # Add another event_field to event (And adding it to the SchemaValidate)
    event_field2 = _db.create_field(name="field_2")
    schema_validate.event_fields.add(event_field2)
    names, paths = SchemaGen.get_related_field_names_and_paths(schema_validate)
    assert paths == [["field_1"], ["field_2"]]
    assert names == {"field_1", "field_2"}
    # Create EventFields in EVENT1
    event_field3 = _db.create_field(name="field_3", event=EVENT1)
    _db.create_field(name="field_4", event=EVENT1)
    # Generate the Schema of EVENT nesting EVENT1
    _db.create_field(name="nested", nature=NATURES.NESTED, nature_id=1)
    schema_validate.event_fields.add(event_field3)
    names, paths = SchemaGen.get_related_field_names_and_paths(schema_validate)
    assert paths == [["field_1"], ["field_2"], ["nested", "field_3"]]
    assert names == {"field_1", "field_2", "nested"}
    # Create Event 2 with 3 fields
    event2 = _db.create_event()
    event_field5 =_db.create_field(event=event2, name="field_5")
    event_field6 = _db.create_field(event=event2, name="field_6")
    _db.create_field(event=event2, name="field_7")
    # Create Event 3 with 2 fields
    event3 = _db.create_event(name="EventName3")
    event_field8 =_db.create_field(event=event3, name="field_8")
    _db.create_field(event=event3, name="field_9")
    # Add a nested field in event 2 nesting event 3
    nested_nature3 = _db.create_nested_nature(event=event3)
    _db.create_field(event=event2, name="nest", nature=NATURES.NESTED, nature_id=nested_nature3.id)
    # Add a nested field in event 1 nesting event 2
    nested_nature2 = _db.create_nested_nature(event=event2)
    _db.create_field(name="nested_2", nature=NATURES.NESTED, nature_id=nested_nature2.id)
    # events_path should not change as we haven't added evetns
    names, paths = SchemaGen.get_related_field_names_and_paths(schema_validate)
    assert paths == [["field_1"], ["field_2"], ["nested", "field_3"]]
    assert names == {"field_1", "field_2", "nested"}
    # Add fields to schema_validate
    schema_validate.event_fields.add(event_field8)
    schema_validate.event_fields.add(event_field6)
    schema_validate.event_fields.add(event_field5)
    names, paths = SchemaGen.get_related_field_names_and_paths(schema_validate)
    assert paths == [
        ["field_1"],
        ["field_2"],
        ["nested", "field_3"],
        ["nested_2", "field_5"],
        ["nested_2", "field_6"],
        ["nested_2", "nest", "field_8"],
    ]
    assert names == {"field_1", "field_2", "nested", "nested_2"}

# @pytest.mark.parametrize("input_props,expected_props", SIMPLE_FIELD_TEST)
# def test_conversion_with_one_string_field_and_empty_xapi_field(_db, input_props, expected_props):
#     """
#     Given a database record of a schema
#     With one not related XAPIField
#     The generated marshmallow schema should dump the default value
#     of the XAPIField
#     """
#     # Create EventField / XAPI Field
#     _db.create_field(name="field_1", **input_props)
#     _db.create_xapi_field(name="x_field")
#     # Generate the Schema
#     schema = SchemaGen.gen_schema_from_record(EVENT)
#     ### START EXPECTED EVENT SCHEMA
#     def func():
#         return None

#     xapi_fields = [{"path": [["x_field"]], "paths": [[]]}]
#     class Eventname(Schema):
#         """desc"""
#         field_1 = fields.String(**expected_props)

#         @post_dump
#         def transform_to_xapi(self, data, **kwargs):
#             transformed = {}
#             for xapi_field in xapi_fields:
#                 kwargs_dict = {}
#                 for path in xapi_field["paths"]:
#                     nested_set(kwargs_dict, path, nested_get(data, path))
#                 nested_set(transformed, xapi_field["path"], func(**kwargs_dict))
#             return transformed

#     ### END EXPECTED EVENT SCHEMA
#     compare_fields(expected=Eventname, actual=schema)