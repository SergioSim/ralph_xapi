"""Serializers"""
from rest_framework import serializers

from . import models

# pylint: disable=missing-class-docstring,too-few-public-methods


class EventSerializer(serializers.ModelSerializer):
    """Event django model serializer"""

    class Meta:
        model = models.Event
        fields = ("id", "name", "description", "parent", "created")


class EventFieldSerializer(serializers.ModelSerializer):
    """EventField django model serializer"""

    class Meta:
        model = models.EventField
        fields = (
            "id",
            "event",
            "name",
            "nature",
            "nature_id",
            "description",
            "required",
            "allow_none",
            "validate",
            "excluded",
        )


class NestedNatureSerializer(serializers.ModelSerializer):
    """NestedNature django model serializer"""

    class Meta:
        model = models.NestedNature
        fields = ("id", "event", "exclude")


class DictNatureSerializer(serializers.ModelSerializer):
    """DictNature django model serializer"""

    class Meta:
        model = models.DictNature
        fields = ("id", "keys", "values")


class ListNatureSerializer(serializers.ModelSerializer):
    """ListNature django model serializer"""

    class Meta:
        model = models.ListNature
        fields = ("id", "event_field")


class IntegerNatureSerializer(serializers.ModelSerializer):
    """IntegerNature django model serializer"""

    class Meta:
        model = models.IntegerNature
        fields = ("id", "strict")


class UrlNatureSerializer(serializers.ModelSerializer):
    """UrlNature django model serializer"""

    class Meta:
        model = models.UrlNature
        fields = ("id", "relative")


class IPv4NatureSerializer(serializers.ModelSerializer):
    """IPv4Nature django model serializer"""

    class Meta:
        model = models.IPv4Nature
        fields = ("id", "exploded")

class EventFieldTestSerializer(serializers.ModelSerializer):
    """EventFieldTest django model serializer"""

    class Meta:
        model = models.EventFieldTest
        fields = ("id", "event_field", "input_data", "input_nature", "validation_exception")
