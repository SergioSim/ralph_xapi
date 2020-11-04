"""Event views"""
import subprocess
import json
import urllib

from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.template import loader
from django.shortcuts import get_object_or_404
from django.views import generic
from rest_framework import generics

from .models import (
    Event, EventField, IPv4Nature, UrlNature, IntegerNature, ListNature, DictNature, NestedNature,
    EventFieldTest, XAPIField
)
from .serializers import (
    EventFieldSerializer, EventSerializer, IPv4NatureSerializer,
    UrlNatureSerializer, IntegerNatureSerializer, ListNatureSerializer,
    DictNatureSerializer, NestedNatureSerializer, EventFieldTestSerializer
)

# import the logging library
import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)


# pylint: disable=no-member,too-many-ancestors
PYTHON_BUDDY_PORT = "3000"
HOST_IP = subprocess.Popen(["ip", "route"], stdout=subprocess.PIPE, text=True).communicate()[0]
PYTHON_BUDDY_ROUTE = f"http://{HOST_IP.split()[2]}:{PYTHON_BUDDY_PORT}/compile"
PYTHON_BUDDY_KEY = "sdkljf56789#KT34_"

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

    queryset = EventField.objects.select_related().all()
    serializer_class = EventFieldSerializer


class EventFieldDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete event fields"""

    queryset = EventField.objects.all()
    serializer_class = EventFieldSerializer

class IPv4NatureListCreate(generics.ListCreateAPIView):
    """List and create IPv4Nature"""

    queryset = IPv4Nature.objects.select_related().all()
    serializer_class = IPv4NatureSerializer


class IPv4NatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete IPv4Nature"""

    queryset = IPv4Nature.objects.all()
    serializer_class = IPv4NatureSerializer


class UrlNatureListCreate(generics.ListCreateAPIView):
    """List and create UrlNature"""

    queryset = UrlNature.objects.select_related().all()
    serializer_class = UrlNatureSerializer


class UrlNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete UrlNature"""

    queryset = UrlNature.objects.all()
    serializer_class = UrlNatureSerializer


class IntegerNatureListCreate(generics.ListCreateAPIView):
    """List and create IntegerNature"""

    queryset = IntegerNature.objects.select_related().all()
    serializer_class = IntegerNatureSerializer


class IntegerNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete IntegerNature"""

    queryset = IntegerNature.objects.all()
    serializer_class = IntegerNatureSerializer


class ListNatureListCreate(generics.ListCreateAPIView):
    """List and create ListNature"""

    queryset = ListNature.objects.select_related().all()
    serializer_class = ListNatureSerializer


class ListNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete ListNature"""

    queryset = ListNature.objects.all()
    serializer_class = ListNatureSerializer


class DictNatureListCreate(generics.ListCreateAPIView):
    """List and create DictNature"""

    queryset = DictNature.objects.select_related().all()
    serializer_class = DictNatureSerializer


class DictNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete DictNature"""

    queryset = DictNature.objects.all()
    serializer_class = DictNatureSerializer


class NestedNatureListCreate(generics.ListCreateAPIView):
    """List and create NestedNature"""

    queryset = NestedNature.objects.select_related().all()
    serializer_class = NestedNatureSerializer


class NestedNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete NestedNature"""

    queryset = NestedNature.objects.all()
    serializer_class = NestedNatureSerializer


class EventFieldTestListCreate(generics.ListCreateAPIView):
    """List and create EventFieldTest"""

    queryset = EventFieldTest.objects.select_related().all()
    serializer_class = EventFieldTestSerializer


class EventFieldTestDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete EventFieldTest"""

    queryset = EventFieldTest.objects.all()
    serializer_class = EventFieldTestSerializer


def test_field_by_event(request, field_id):
    """Returns all EventFieldTests for a given event_field id"""
    queryset = EventFieldTest.objects.filter(event_field_id=field_id)
    return JsonResponse({"data": EventFieldTestSerializer(queryset, many=True).data})

def prepare_input_data(field_test):
    """prepares field_test input_data for template rendering"""
    NATURE = XAPIField.XAPINature
    if field_test.input_nature == NATURE.STRING:
        field_test.input_data = json.dumps(field_test.input_data)
    if field_test.input_nature == XAPIField.XAPINature.NULL:
        field_test.input_data = "None"

def code_field(request, pk):
    """Execute code in PythonBuddySandbox and return the result"""
    event_field = get_object_or_404(EventField, pk=pk)
    field_tests = event_field.eventfieldtest_set.all()
    if not event_field.validate or not field_tests:
        return HttpResponseBadRequest("EventField has no validation function or tests defined!")
    template = loader.get_template('event/code_field_test.txt')
    for test_field in field_tests:
        prepare_input_data(test_field)
    event_field.validate = "    " + event_field.validate.replace("\n", "\n    ")
    event_field.name = "".join([e for e in event_field.name if e.isalnum()])
    context = {
        "field": event_field,
        "field_tests": field_tests,
    }
    logger.error(template.render(context, request))
    if request.method == "GET":
        return HttpResponse("<pre>" + template.render(context, request) + "</pre>")
    json_data = {"code": template.render(context, request), "typeRequest": "run"}
    data = bytes(json.dumps(json_data).encode("utf-8"))
    headers = {"Content-Type": "application/json", "X-API-Key": PYTHON_BUDDY_KEY}
    req = urllib.request.Request(PYTHON_BUDDY_ROUTE, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            response_data = resp.read().decode("utf-8")
    except urllib.error.URLError as ex:
        response_data = ex.reason
    return JsonResponse(json.loads(response_data))


class IndexView(generic.ListView):
    """Show all events"""

    template_name = "event/index.html"
    context_object_name = "events"

    def get_queryset(self):
        """Return all events"""
        return Event.objects.order_by("name")


class ShowView(generic.DetailView):
    """Show event"""

    model = Event
    template_name = "event/show.html"


class EditView(generic.DetailView):
    """Edit event"""

    model = Event
    template_name = "event/edit.html"
