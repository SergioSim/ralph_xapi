"""Serializers"""
from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    """Event django model serializer"""

    class Meta:
        model = Event
        fields = ('id', 'name', 'description', 'parent', 'created')
