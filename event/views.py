"""Event views"""
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic
from rest_framework import generics

from .models import Event, EventField
from .serializers import EventSerializer, EventFieldSerializer

# Create your views here.

class EventListCreate(generics.ListCreateAPIView):
    """List and create events"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class EventDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete events"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class EventFieldListCreate(generics.ListCreateAPIView):
    """List and create event fields"""
    queryset = EventField.objects.all()
    serializer_class = EventFieldSerializer

class EventFieldDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete event fields"""
    queryset = EventField.objects.all()
    serializer_class = EventFieldSerializer

class IndexView(generic.ListView):
    """Show all events"""
    template_name = 'event/index.html'
    context_object_name = 'events'

    def get_queryset(self):
        """Return all events"""
        return Event.objects.order_by('name')

class ShowView(generic.DetailView):
    """Show event"""
    model = Event
    template_name = 'event/show.html'

class EditView(generic.DetailView):
    """Edit event"""
    model = Event
    template_name = 'event/edit.html'
